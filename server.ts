import * as fs from 'node:fs';
import { ReadStream } from 'node:fs';
import * as http from 'node:http';
import * as path from 'node:path';
import { resourceLimits } from 'node:worker_threads';

const PORT = 8000;

type Mime = {
    [id: string]: string
}

const MIME_TYPES: Mime = {
    default: 'application/octet-stream',
    html: 'text/html; charset=UTF-8',
    js: 'application/javascript',
    css: 'text/css',
    png: 'image/png',
    jpg: 'image/jpg',
    gif: 'image/gif',
    ico: 'image/x-icon',
    svg: 'image/svg+xml',
};

const STATIC_PATH = path.join(process.cwd(), '/static');
const OUT_PATH = path.join(process.cwd(), '/out')

const toBool = [() => true, () => false];

type FetchFile = {
    readStream: ReadStream, 
    extension: string,
    found: boolean
}

const fetchFileFromURL = async (url: string): Promise<FetchFile> => {
    const extension = getExtension(url);
    const filePath = getFilePath(url)

    const fileExists = fs.existsSync(filePath);
    if(!fileExists) {
       return {
        readStream: new ReadStream(),
        extension,
        found: false
       } 
    }

    const readStream = fs.createReadStream(filePath);

    return { readStream, extension, found: true };
};

const getExtension = (url: string): string => {
    // does it end with / -> return html
    if (url.endsWith("/")) {
        return MIME_TYPES.html
    }

    const index = url.indexOf(".")
    if(index === -1) {
        return MIME_TYPES.default
    }

    return url.substring(index)
}


const getFilePath = (url: string): string => {
    const paths = [process.cwd()]
    if (url.endsWith("/")) {
        paths.push("static")
        paths.push("index.html")
        return paths.join("/") 
    }

    paths.push(url)
    return paths.join("/")
}

const server = http.createServer(async (req, res) => {
    if (req.url === undefined) {
        res.statusCode = 400
        return
    }

    const { readStream, found, extension } = await fetchFileFromURL(req.url);
    const statusCode = found ? 200 : 404;
    readStream.pipe(res);

    console.log(`${req.method} ${req.url} ${statusCode}`);
});

server.listen(PORT)

console.log(`Server running at http://127.0.0.1:${PORT}/`);