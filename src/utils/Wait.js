/**
 * estimate the amount of time it will take for all models to run predicition on video. 
 * @param  {float} vid_sec [duration of video file]
 * @param  {bool} first_video [assess whether this is the first video file upload]
 * @return {float} [wait time, in milliseconds, per progress bar increment]
 */
 export default function estimate_runtime(vid_sec, first_video) {
    // true runtime per video second
    let sec_per_vid_sec = 1
    // set it relative to video duration
    if(vid_sec<=1.0)
        sec_per_vid_sec=109.0
    else if(vid_sec<=2.5) 
        sec_per_vid_sec=48.67
    else if(vid_sec<=5.0) 
        sec_per_vid_sec=33.0
    else
        sec_per_vid_sec=26.35
    
    // the average additional wait time for the first video upload (sec)
    const vid1_hinder= 40.0

    // milliseconds per increment in progress bar
    let per_increment = 100
    // perform calculations
    if(first_video===true)
        per_increment = ((sec_per_vid_sec * vid_sec + vid1_hinder) * 1000)/100
    else
        per_increment = (sec_per_vid_sec * vid_sec * 1000)/100
    // round to 2 decimal places
    per_increment = Number(per_increment.toFixed(2));
    
    return per_increment;
};