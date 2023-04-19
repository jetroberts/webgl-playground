import * as fs from 'node:fs';
import { ReadStream } from 'node:fs';
import * as http from 'node:http';

const PORT = 8000;

type Mime = 
    "application/octet-stream" | 
    'text/html; charset=UTF-8' |
    'application/javascript' |
    'text/css' |
    'image/png' |
    'image/jpg' |
    'image/gif' |
    'image/x-icon' |
    'image/svg+xml' 

type MimeType = {
    [id: string]: Mime
}

const MIME_TYPES: MimeType = {
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

type FetchFile = {
    readStream: ReadStream | null, 
    mimeType: Mime,
    found: boolean
}

const fetchFileFromURL = async (url: string): Promise<FetchFile> => {
    const mimeType = getMimeType(url);
    const filePath = getFilePath(url)

    const fileExists = fs.existsSync(filePath);
    if(!fileExists) {
       return {
        readStream: null,
        mimeType,
        found: false
       } 
    }

    try {
        const readStream = fs.createReadStream(filePath);
        return { readStream, mimeType, found: true}
    } catch (e: unknown) {
        console.error(e)
        return { readStream: null, mimeType, found: true };
    }
};

const getMimeType = (url: string): Mime => {
    if (url.endsWith("/")) {
        return MIME_TYPES.html
    }

    const index = url.indexOf(".")
    if(index === -1) {
        return MIME_TYPES.default
    }

    const ending = url.substring(index + 1)
    const mimeType = MIME_TYPES[ending]
    if (mimeType === undefined) {
        return MIME_TYPES.default
    }

    return mimeType
}


const getFilePath = (url: string): string => {
    const paths = [process.cwd()]
    if (url.endsWith("/")) {
        paths.push("index.html")
        return paths.join("/") 
    }

    paths.push(url.replace("/", ""))
    return paths.join("/")
}

const server = http.createServer(async (req, res) => {
    if (req.url === undefined) {
        res.statusCode = 400
        return
    }

    const { readStream, found, mimeType} = await fetchFileFromURL(req.url);
    const statusCode = found || readStream === null ? 200 : 404;
    res.writeHead(statusCode, {
        'Content-Type': mimeType,
    })
    try {
        if(readStream !== null) {
            readStream.pipe(res);
        }
        console.log(`${req.method} ${req.url} ${statusCode}`);
    } catch (e: unknown) {
        console.error(e)
    }
});

server.listen(PORT)

console.log(`Server running at http://127.0.0.1:${PORT}/`);