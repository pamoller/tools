import "https://deno.land/std@0.196.0/dotenv/load.ts";
import { parseArgs } from "@std/cli/parse-args";
import markdownIt from "npm:markdown-it";
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

const args = parseArgs(Deno.args);
const formatPath = args.format ?? readEnv("DEFAULT_FORMAT");
const outputPath = args.output ?? "output.pdf";
const htmlTemplate = readFile(formatPath + "/html.tmpl");
const style = readFile(formatPath + "/style.css");
const pdfOptions = parseJson(formatPath + "/config.json");
const htmlBody = parseMd(args._)
const htmlDocument = replace(htmlTemplate, htmlBody, style);

const browser = await puppeteer.launch({
    executablePath: readEnv("PUPPETEER_EXECUTABLE_PATH")
});
const page = await browser.newPage();
await page.setContent(htmlDocument, { waitUntil: "load" });
await page.pdf({...pdfOptions, ...{path: outputPath}});
await browser.close();

function replace(template: string, body: string, style: string): string {
    if (template.indexOf("{{ body }}") === -1)
        error("Template must contain '{{ body }}'");
    if (template.indexOf("{{ style }}") === -1)
        error("Template must contain '{{ style }}'");
    return template.replace("{{ body }}", body).replace("{{ style }}", style);
}

function parseMd(paths: string[]): string {
    if (paths.length === 0)
        error("No input files");
    const converter = new markdownIt();
    const markdown = paths.map((path: string) => Deno.readTextFileSync(path)).join("\n\n");
    return converter.render(markdown);
}

function readFile(path: string): string {
    try {
        return Deno.readTextFileSync(Deno.realPathSync(path)); 
    } catch (e) {
        error("File not found: " + path);
    }
    return "";
}

function parseJson(path: string): Object {
    try {
        return JSON.parse(readFile(path));
    } catch (e) {
        error("Invalid JSON file: " + path);
    }
    return {};
}

function readEnv(name: string): string {
    if (Deno.env.get(name) === undefined)
        error("Environment variable not set: " + name);
    try {
        return Deno.realPathSync(Deno.env.get(name) ?? "");
    } catch (e) {
        error("Invalid path in env variable " + name);
    }
    return "";
}

function error(message: string) {
    console.error("ERROR: " + message);
    usage();
    Deno.exit(1);
}

function usage() {
    console.log("Usage: md2pdf.ts [options] <markdown files>");
    console.log("Options:");
    console.log("  --format <path>   Path to the format directory");
    console.log("  --output <path>   Output path of the PDF file");
};