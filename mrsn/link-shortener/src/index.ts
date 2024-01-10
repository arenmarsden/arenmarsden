import { Hono } from "hono";
import { cors } from "hono/cors";
import { html } from "hono/html";

interface Url {
	url: string;
	short: string;
}

type Bindings = {
	DB: D1Database;
}

function createRandomSequence(length: number) {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}

const app = new Hono<{ Bindings: Bindings }>();
app.use('*', cors());

app.post('/create', async context => {
	const { url } = await context.req.json<Url>();
	const short = createRandomSequence(12); 
	const { success } = await context.env.DB.prepare('INSERT INTO links (url, short) VALUES (?, ?)')
		.bind(url, short)
		.run();
	
	if (success) {
		context.status(201);
		return context.json({ 
			short: short,
			url: url,
			shortUrl: `https://mrsn.dev/${short}`
		});
	} else {
		context.status(500);
		return context.json({ error: 'Something went wrong' });
	}
});

app.get('/:short', async context => {
	const { short } = await context.req.param();
	const url = await context.env.DB.prepare('SELECT url FROM links WHERE short = ?')
		.bind(short)
		.first();


	if (url) {
		context.status(200);
		return context.redirect(`${url.url}`)
	} else {
		context.status(404);
		return context.json({ error: 'Not found' });
	}
});

app.notFound(context => context.text('404 Not Found'));

export default app;