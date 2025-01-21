console.log(__dirname); // current directory
console.log(__filename); // current file

// file system : sync
// const fs = require("fs");

// fs.mkdirSync("myFolder"); // this creates a directory by this name

// fs.writeFileSync("myFolder/bio.text", "this is sample bio");

// fs.appendFileSync("myFolder/bio.text", " updated now");

// const rawData = fs.readFileSync("myFolder/myBio.text");
// console.log(rawData);

// const data = fs.readFileSync("myFolder/myBio.text", "utf-8");
// console.log(data);

// fs.renameSync("myFolder/bio.text", "myFolder/myBio.text");

// fs.copyFile('read.txt', 'text.txt');

// delete file
// fs.unlinkSync("myFolder/myBio.text");

// file system : promise

const fs = require("fs/promises");

// fs.mkdir("myFolder");

// fs.writeFile("myFolder/bio.text", "writing to this file");

// fs.appendFile("myFolder/bio.text", " now updated");

// fs.open("myFolder/generated.txt", "w"); // it will simply create this file, with "Write" access

// fs.rename("myFolder/bio.txt", "myFolder/myBio.txt");

// fs.readFile("myFolder/myBio.txt", "utf-8").then((d) => console.info("data: ", d));

// fs.unlink("myFolder/myBio.txt");

fs.rmdir("myFolder", { maxRetries: 2 });

// fs.chmod('read.txt', 0o400); // (filePath, grant or permission for this file access)

// available granting access modes: https://nodejs.org/api/fs.html#fspromiseschmodpath-mode

// https://kinsta.com/knowledgebase/nodejs-fs/
