// 0 1 0 1 1
/*
* 1 * 2 exponent 0 = 1
* 1 * 2¹ = 2
* 0 * 2² = 0
* 1 * 2³ = 8
* 0 * 2 exponent 4 = 0
*
* 1 + 2 + 0 + 8 + 0 = 11
*
*
* 321 base (10)
*
* 1 * 10 exponent 0 = 1
* 2 * 10¹ = 20
* 3 * 10² = 300
*
*
* 0x456 (base 16)  =  0x is just decoration i.e. hexadecimal number  = 1110
* 6 * 16 exponent 0 = 6
* 5 * 16¹ = 80
* 4 * 16² = 1024
*
* fa3c = 64060
* 12 * 16 exponent 0 = 12
* 3 * 16¹ = 48
* 10 * 16² = 2560
* 15 * 16³ =  61440
*
*
*
* 16777215 : convert this to binary
* */

// Node has this `Buffer` to manage raw binary data
// `Buffer` receives data from one place the may/may not do something then sends out the data
const buff = Buffer.alloc(8); // 8 bit or 1 byte size memory given here

// this won't throw error but after 8 characters rest will be ignored
// buff.write('121212121212', 'utf-8');

// take string `st` encode using `utf-8` then get the bytes then assign to buff variable
buff.write("st", "utf-8");
console.log(buff[0])
console.log(buff);
// console.log(buff.toJSON());

// const buff2 = Buffer.from('string', 'utf-8');
// console.log(buff2);

const buff2 = Buffer.from([115, 116, 114, 105, 110, 103], 'hex~');
console.log(`buff2: `, buff2.toString("utf-8"));
