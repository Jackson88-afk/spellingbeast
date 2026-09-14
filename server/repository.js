'use strict';

function validDate(value, fallback) {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
}

function normalizeWords(words) {
  const seen = new Set();
  const result = [];
  for (const raw of Array.isArray(words) ? words : []) {
    const word = String(raw).trim();
    const normalizedWord = word.toLocaleLowerCase('en-US');
    if (!word || seen.has(normalizedWord)) continue;
    seen.add(normalizedWord);
    result.push({ word, normalizedWord });
  }
  return result;
}

function normalizeWordList(input) {
  const now = new Date().toISOString();
  const id = String(input?.id || '').trim();
  const name = String(input?.name || '').trim();
  const words = normalizeWords(input?.words);
  if (!id) throw Object.assign(new Error('Word list id is required.'), { code: 'invalid_word_list' });
  if (!name || name.length > 80) throw Object.assign(new Error('Word list name is invalid.'), { code: 'invalid_word_list' });
  if (!words.length) throw Object.assign(new Error('Add at least one usable word.'), { code: 'empty_word_list' });
  return {
    id,
    name,
    words,
    createdAt: validDate(input.createdAt, now),
    updatedAt: validDate(input.updatedAt, now),
  };
}

function normalizeMistake(input) {
  const now = new Date().toISOString();
  const wordListId = String(input?.wordListId || '').trim();
  const word = String(input?.word || '').trim();
  const normalizedWord = word.toLocaleLowerCase('en-US');
  const id = String(input?.id || `${wordListId}::${normalizedWord}`).trim();
  if (!wordListId || !word || !id) throw Object.assign(new Error('Mistake is invalid.'), { code: 'invalid_mistake' });
  return {
    id,
    wordListId,
    word,
    normalizedWord,
    createdAt: validDate(input.createdAt, now),
    updatedAt: validDate(input.updatedAt, now),
  };
}

function toWordList(row, words) {
  return {
    id: row.id,
    name: row.name,
    words: words.map((entry) => entry.word),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

function toMistake(row) {
  return {
    id: row.id,
    wordListId: row.word_list_id,
    ...(row.word_list_name ? { wordListName: row.word_list_name } : {}),
    word: row.word,
    active: true,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

function createRepository(pool) {
  async function loadState(ownerId, client = pool) {
    const [listsResult, wordsResult, mistakesResult] = await Promise.all([
      client.query('select id, name, created_at, updated_at from word_lists where owner_id = $1 order by created_at, id', [ownerId]),
      client.query(`select w.word_list_id, w.position, w.word from word_list_words w join word_lists l on l.id = w.word_list_id where l.owner_id = $1 order by w.word_list_id, w.position`, [ownerId]),
      client.query(`select m.*, l.name as word_list_name from active_mistakes m left join word_lists l on l.id = m.word_list_id and l.owner_id = m.owner_id where m.owner_id = $1 order by m.created_at, m.id`, [ownerId]),
    ]);
    const wordsByList = new Map();
    for (const row of wordsResult.rows) {
      if (!wordsByList.has(row.word_list_id)) wordsByList.set(row.word_list_id, []);
      wordsByList.get(row.word_list_id).push(row);
    }
    return {
      wordLists: listsResult.rows.map((row) => toWordList(row, wordsByList.get(row.id) || [])),
      activeMistakes: mistakesResult.rows.map(toMistake),
    };
  }

  async function upsertWordList(ownerId, input, clientOverride) {
    const list = normalizeWordList(input);
    const client = clientOverride || await pool.connect();
    const ownsClient = !clientOverride;
    try {
      if (ownsClient) await client.query('begin');
      const conflict = await client.query('select owner_id from word_lists where id = $1', [list.id]);
      if (conflict.rows[0] && String(conflict.rows[0].owner_id) !== ownerId) {
        throw Object.assign(new Error('Resource not found.'), { code: 'not_found', status: 404 });
      }
      await client.query(`insert into word_lists (id, owner_id, name, created_at, updated_at) values ($1,$2,$3,$4,$5)
        on conflict (id) do update set name = excluded.name, updated_at = excluded.updated_at where word_lists.owner_id = excluded.owner_id`,
      [list.id, ownerId, list.name, list.createdAt, list.updatedAt]);
      await client.query('delete from word_list_words where word_list_id = $1', [list.id]);
      for (let position = 0; position < list.words.length; position += 1) {
        const entry = list.words[position];
        await client.query('insert into word_list_words (word_list_id, position, word, normalized_word) values ($1,$2,$3,$4)', [list.id, position, entry.word, entry.normalizedWord]);
      }
      if (ownsClient) await client.query('commit');
      return { id: list.id, name: list.name, words: list.words.map((entry) => entry.word), createdAt: list.createdAt, updatedAt: list.updatedAt };
    } catch (error) {
      if (ownsClient) await client.query('rollback');
      throw error;
    } finally {
      if (ownsClient) client.release();
    }
  }

  async function upsertMistake(ownerId, input, client = pool) {
    const mistake = normalizeMistake(input);
    const foreignList = await client.query('select 1 from word_lists where id = $1 and owner_id = $2', [mistake.wordListId, ownerId]);
    if (!foreignList.rows.length) throw Object.assign(new Error('Word list not found.'), { code: 'not_found', status: 404 });
    const result = await client.query(`insert into active_mistakes (id, owner_id, word_list_id, word, normalized_word, created_at, updated_at)
      values ($1,$2,$3,$4,$5,$6,$7)
      on conflict (owner_id, word_list_id, normalized_word) do update set word = excluded.word, updated_at = excluded.updated_at
      returning *`, [mistake.id, ownerId, mistake.wordListId, mistake.word, mistake.normalizedWord, mistake.createdAt, mistake.updatedAt]);
    return toMistake(result.rows[0]);
  }

  async function deleteMistake(ownerId, id, client = pool) {
    await client.query('delete from active_mistakes where id = $1 and owner_id = $2', [id, ownerId]);
  }

  async function migrate(ownerId, payload) {
    const client = await pool.connect();
    try {
      await client.query('begin');
      for (const list of Array.isArray(payload?.wordLists) ? payload.wordLists : []) await upsertWordList(ownerId, list, client);
      for (const mistake of Array.isArray(payload?.activeMistakes) ? payload.activeMistakes : []) await upsertMistake(ownerId, mistake, client);
      await client.query('commit');
      return loadState(ownerId);
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally {
      client.release();
    }
  }

  return { deleteMistake, loadState, migrate, upsertMistake, upsertWordList };
}

module.exports = { createRepository, normalizeMistake, normalizeWordList, normalizeWords };
