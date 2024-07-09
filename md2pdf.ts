import "https://deno.land/std@0.196.0/dotenv/load.ts";
import Md2Pdf from "../../src/publisher/infrastructure/converter/Md2Pdf.ts";

const outputPath = "output.pdf" //Deno.args[1];
const content = Deno.args.map((path: string) => Deno.readTextFileSync(path)).join("\n\n");
const converter = new Md2Pdf();
const html = converter.render(content);
await converter.convert(html, outputPath);
