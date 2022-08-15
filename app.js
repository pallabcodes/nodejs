setTimeout(() => { console.log(`done`)}, 1);

// so until when this loop done the "main thread will be blocked" & only after that setTimeout value will log
for (let  i = 0; i < 1000000000; i++) {}



