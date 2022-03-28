/**
 * find all decimals in a text file
 * @param  {string} fileName [directory of text file]
 * @return {array float}     [all decimal occurences]
 */
const extract_percents = (fileName) => {

    // find all decimal numbers in the text file
    const fs = require('fs');
    const process = require('process');
    let reg_exp=/[0-9]+.[0-9]+/
    let all_values=[];
    let counter=0;

    // obtain the string representations of values
    try
    {
        let data = fs.readFileSync(process.cwd()+fileName, 'utf8')
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
    } 
    catch(err)
    {
        console.error(err)
        all_values=[0, 0, 0, 0]
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
    const process = require('process');
    try
    {
        // path.resolve(__dirname, fileName)
        let data = fs.readFileSync(process.cwd()+fileName, 'utf8')
        return data;
    }
    catch (err)
    {
        console.error(err)
        return "?????"
    }
};

/**
 * convert the data from result_DFD.txt to json format
 * @param
 * @return {json} extracted score
 */
const update_DFD = () => {

    let DFD_score=extract_percents("/../../backend/AllResults/result_DFD.txt");
    console.log(DFD_score)

    // organize data in json format and write to file
    let DFD_json = { 
        "DFD": DFD_score[0] 
    };
    let data = JSON.stringify(DFD_json, null, 2);
    return data;
};


/**
 * convert the data from result_blink.txt to json format
 * @param
 * @return {json} extract eye blink scores
 */
const update_blink = () => {

    let all_blinks=extract_percents("/../../backend/AllResults/result_blink.txt");
    console.log(all_blinks)

    // organize data in json format
    let blinks_json = { 
        "closed": all_blinks[3],
        "missing": all_blinks[0],
        "open": all_blinks[2],
        "unknown": all_blinks[1] 
    };
    let data = JSON.stringify(blinks_json, null, 2);
    return data;
};


/**
 * look at the data from result_beard.txt and assess whether a beard is present, 
 * then, convert data to json format
 * @param
 * @return {json} beard detection elements + raw output
 */
const update_beard = () => {

    let beard_text=extract_text("/../../backend/AllResults/result_beard.txt");

    // retrieve age
    let all_beard=[]
    if(beard_text.indexOf("Age: ??")!=-1)
        all_beard[0]=0
    else
        if(/\d{2}/.test(beard_text)==true)
            all_beard[0]=parseInt(beard_text.substring(8,10))
        else
            all_beard[0]=parseInt(beard_text.substring(8,9))

    // retrieve gender
    if(beard_text.indexOf("Man")!=-1)
        all_beard[1]="Man"
    else if(beard_text.indexOf("Woman")!=-1)
        all_beard[1]="Woman"
    else
        all_beard[1]="??"

    // an adult male may have a beard
    if(all_beard[0]>=20 && all_beard[1]=="Man")
        all_beard[2]=true
    else
        all_beard[2]=false

    console.log(all_beard)

    // organize data in json format
    let beard_json = { 
        "age": all_beard[0], 
        "beard": all_beard[2],
        "gender": all_beard[1], 
        "raw_output": beard_text 
    };
    let data = JSON.stringify(beard_json, null, 2);
    return data;
};

/**
 * look at the data from result_shades.txt and assess whether shades are present, 
 * then, convert data to json format
 * @param
 * @return {json} shades detection element + raw output
 */
const update_shades = () => {

    let shades_text=extract_text("/../../backend/AllResults/result_shades.txt");

    // although unlikely, it's possible for detect_shades() to have segmentation fault
    if(shades_text==="")
        shades_text="Segmentation fault"

    // were sunglasses detected?
    let all_shades=false
    if(shades_text.indexOf("sunglasses")!=-1)
        all_shades=true

    console.log(all_shades)

    // organize data in json format
    let shades_json = { 
        "raw_output": shades_text,
        "shades": all_shades 
    };
    let data = JSON.stringify(shades_json, null, 2);
    return data;
};

// update all
const fs = require('fs');

list_of_updates= [update_DFD(), update_blink(), update_beard(), update_shades()];

fs.writeFileSync("AllResultsJSON/result_update.json", '['+list_of_updates+']');