/**
 * find all decimals in a text file
 * @param  {string} fileName [directory of text file]
 * @return {array float}     [all decimal occurences]
 */
const extract_percents = (fileName) => {

    // find all decimal numbers in the text file
    const fs = require('fs')
    let reg_exp=/[0-9]+.[0-9]+/
    let all_values=[];

    // obtain the string representations of values
    try
    {
        let data = fs.readFileSync(fileName, 'utf8')
        let counter=0;
        while(true)
        {
            if(reg_exp.test(data)==true)
            {
                all_values[counter]=reg_exp.exec(data)[0]
                data=data.replace(reg_exp, "a")
                counter+=1;
            }
            else
                break;
        }
        console.log(all_values);
    } 
    catch (err) 
    {
        console.error(err)
    }
    
    // obtain the float representations of values
    counter=0
    while(counter<all_values.length)
    {
        all_values[counter]=parseFloat(all_values[counter])
        counter+=1
    }

    return all_values;
};

/**
 * obtain the text in file as one string object
 * @param  {string} fileName [directory of text file]
 * @return {string}          [contents of fileName]
 */
const extract_text = (fileName) => {

    // obtain the text in file as one string object
    const fs = require('fs')
    try
    {
        let data = fs.readFileSync(fileName, 'utf8')
        return data;
    }
    catch (err)
    {
        console.error(err)
        return "0"
    }
};

console.log(extract_percents("Home/VideoFilePlayer/result_blink.txt"));
console.log(extract_text("Home/VideoFilePlayer/result_blink.txt"));