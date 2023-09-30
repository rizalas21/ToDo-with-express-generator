function sum() {
    let index = 0;
    for(let i = 0; i < arguments.length; i++) {
        index += arguments[i]
    }
    return index
}

console.log(sum(1,2,3,4)) //output 10
console.log(sum(3,4)) //output 7
console.log(sum(13)) //output 13