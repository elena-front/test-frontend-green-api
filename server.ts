import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

type RequestData = Record<string, unknown>;
type ApiResult = Record<string, unknown> | null;

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '127.0.0.1';
const pagesOrigin = 'https://elena-front.github.io';
const production = process.env.NODE_ENV === 'production';
const vite = production ? null : await (await import('vite')).createServer({ server: { middlewareMode: true }, appType: 'spa' });
const dist = resolve('dist');

function send(res: http.ServerResponse, code: number, data: unknown): void {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}

async function body(req: http.IncomingMessage): Promise<RequestData> {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 10000) throw new Error('Слишком большой запрос');
  }
  const parsed: unknown = raw ? JSON.parse(raw) : {};
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Некорректный запрос');
  return parsed as RequestData;
}

function credentials(data: RequestData): string {
  const id = String(data.idInstance || '').trim();
  const token = String(data.apiTokenInstance || '').trim();
  const apiUrl = String(data.apiUrl || 'https://api.green-api.com').trim().replace(/\/+$/, '');
  const url = new URL(apiUrl);
  if (!/^\d{5,15}$/.test(id) || !/^[A-Za-z0-9_-]{10,200}$/.test(token)) throw new Error('Проверьте ID и токен инстанса');
  if (url.protocol !== 'https:' || !/(^|\.)green-api\.com$/.test(url.hostname) || url.username || url.password || url.port || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('API URL должен быть HTTPS адресом GREEN-API');
  }
  return `${url.origin}/waInstance${id}`;
}

async function green(data: RequestData, method: string, payload: RequestData | null, httpMethod = 'POST', suffix = ''): Promise<ApiResult> {
  const base = credentials(data);
  const token = String(data.apiTokenInstance).trim();
  const endpoint = `${base}/${method}/${token}${suffix}`;
  const response = await fetch(endpoint, {
    method: httpMethod,
    headers: payload ? { 'Content-Type': 'application/json' } : undefined,
    body: payload ? JSON.stringify(payload) : undefined,
    signal: AbortSignal.timeout(18000),
  });
  const content = await response.text();
  let result: ApiResult;
  try { result = content ? JSON.parse(content) as ApiResult : null; }
  catch { result = { message: content.slice(0, 200) }; }
  if (!response.ok) {
    const detail = result?.message || result?.reason || result?.error || `Ошибка GREEN-API (${response.status})`;
    throw new Error(typeof detail === 'string' ? detail : `Ошибка GREEN-API (${response.status})`);
  }
  return result;
}

async function api(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  if (req.method !== 'POST') return send(res, 405, { error: 'Метод не поддерживается' });
  try {
    const data = await body(req);
    let result: ApiResult;
    if (req.url === '/api/connect') {
      result = await green(data, 'getStateInstance', null, 'GET');
      if (result?.stateInstance !== 'authorized') throw new Error('Инстанс не авторизован в WhatsApp. Проверьте его статус в личном кабинете GREEN-API.');
    } else if (req.url === '/api/check-account') {
      const phone = String(data.phone || '').replace(/\D/g, '');
      if (!/^\d{7,15}$/.test(phone)) throw new Error('Введите номер с кодом страны, от 7 до 15 цифр');
      result = await green(data, 'checkWhatsapp', { chatId: `${phone}@c.us` });
      if (result?.status === false) throw new Error(String(result.reason || (result.data as Record<string, unknown> | undefined)?.reason || 'Не удалось проверить номер'));
    } else if (req.url === '/api/send') {
      const chatId = String(data.chatId || '');
      const message = String(data.message || '').trim();
      if (!/^\d{7,20}@(c\.us|lid)$/.test(chatId) || !message || message.length > 4096) throw new Error('Проверьте чат и текст сообщения (до 4096 символов)');
      result = await green(data, 'sendMessage', { chatId, message });
      if (!result?.idMessage) throw new Error('GREEN-API не подтвердил отправку сообщения');
    } else if (req.url === '/api/receive') {
      result = await green(data, 'receiveNotification', null, 'GET');
      if (result?.status === 'error') throw new Error(String(result.message || 'Не удалось получить уведомление'));
      if (result && (!Number.isSafeInteger(result.receiptId) || !result.body)) throw new Error('GREEN-API вернул некорректное уведомление');
    } else if (req.url === '/api/ack') {
      const receiptId = Number(data.receiptId);
      if (!Number.isSafeInteger(receiptId) || receiptId < 0) throw new Error('Некорректный идентификатор уведомления');
      result = await green(data, 'deleteNotification', null, 'DELETE', `/${receiptId}`);
    } else return send(res, 404, { error: 'Не найдено' });
    send(res, 200, result);
  } catch (error) {
    send(res, error instanceof SyntaxError ? 400 : 502, { error: error instanceof Error ? error.message : 'Ошибка соединения' });
  }
}

const types: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
const server = http.createServer(async (req, res) => {
  if (req.url?.startsWith('/api/')) {
    res.setHeader('Vary', 'Origin');
    if (req.headers.origin === pagesOrigin) {
      res.setHeader('Access-Control-Allow-Origin', pagesOrigin);
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
    if (req.method === 'OPTIONS') {
      res.writeHead(req.headers.origin === pagesOrigin ? 204 : 403);
      res.end();
      return;
    }
    return api(req, res);
  }
  if (vite) return vite.middlewares(req, res);
  try {
    const pathname = decodeURIComponent(new URL(req.url || '/', 'http://localhost').pathname);
    const file = resolve(dist, `.${pathname}`);
    if (file !== dist && !file.startsWith(dist + sep)) return send(res, 403, { error: 'Недоступно' });
    const actual = (await stat(file).catch(() => null))?.isFile() ? file : resolve(dist, 'index.html');
    res.writeHead(200, { 'Content-Type': `${types[extname(actual)] || 'application/octet-stream'}; charset=utf-8` });
    res.end(await readFile(actual));
  } catch { send(res, 404, { error: 'Не найдено' }); }
});
server.listen(port, host, () => console.log(`Chat ready: http://${host}:${port}`));
