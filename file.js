console.log(__dirname);
console.log(__filename);

// file system : sync
// const fs = require("fs");

// fs.mkdirSync("thapa");

// fs.writeFileSync("thapa/bio.text", "this is sample bio");

// fs.appendFileSync("thapa/bio.text", " update now");

// const data = fs.readFileSync("thapa/bio.txt", "utf-8");
// console.log(data);

// fs.renameSync("thapa/bio.txt", "thapa/myBio.txt");

// delete file
// fs.unlinkSync("thapa/myBio.txt");

// file system : promise

const fs = require("fs/promises");

// fs.mkdir("text");

// fs.writeFile("text/bio.text", "writing to this file");

// fs.appendFile("text/bio.text", " this is now updated");

// fs.rename("text/bio.text", "text/myBio.txt");

// fs.readFile("text/myBio.txt", "utf-8").then((d) => console.log(d));

// fs.unlink("text/myBio.txt");

// fs.rmdir("text", { maxRetries: 2 });
