import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

let help_text=[]
help_text[0]="- You may only upload .mp4 videos."
help_text[1]="- The time it takes to generate results increases with video duration. \
                Please upload videos w/ durations of 20 seconds or less."
help_text[2]="- The eye blink model returns 2 classifications. For greater interpretability, \
                we display 2 more classifications. If a face isn't detected, the frame is \
                called missing. If a persons face is detected but only partially, it's \
                called unknown. All other frames are put into the model and classified as \
                open eyes or closed eyes."
help_text[3]="- From our testing, the base model is most likely to yield incorrect predicitions \
                in the yellow range. Look at the user trust model outputs to draw any final \
                conclusions. Otherwise, a green score indicates a genuine video and a red score \
                indicates a deepfake."
help_text[4]="- Look at the raw data! Unless there are a significant number of missing frames, \
                the eye blink classification for each video frame is recorded on an excel sheet\
                for download. The other models data can be found by hovering over buttons."
help_text[5]="Troubleshooting: If the output didn't change upon clicking \'Generate Results\', \
              it's possible the program exceeded system resources and ended abruptly. If the base \
              model returned a score of 0.5, the program possibly ran into exception \
              DefaultCPUAllocator, not enough available memory to run a prediction. \
              Both issues can be resolved by uploading a video w/ smaller duration. \
              Other obscure errors can be caused by not installing librarys from the \
              dependency list listed in the README.md."

export default function PopUp_Help() {
  const [open, setOpen] = React.useState(false);
  const [scroll, setScroll] = React.useState('paper');

  const handleClickOpen = (scrollType) => () => {
    setOpen(true);
    setScroll(scrollType);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const descriptionElementRef = React.useRef(null);
  React.useEffect(() => {
    if (open) {
      const { current: descriptionElement } = descriptionElementRef;
      if (descriptionElement !== null) {
        descriptionElement.focus();
      }
    }
  }, [open]);

  return (
    <label>
      <Button style={{ marginLeft: 10 }} component="span" variant="contained" onClick={handleClickOpen('paper')}>Help</Button>
      <Dialog
        open={open}
        onClose={handleClose}
        scroll={scroll}
        aria-labelledby="scroll-dialog-title"
        aria-describedby="scroll-dialog-description"
      >
        <DialogTitle id="scroll-dialog-title">Help</DialogTitle>
        <DialogContent dividers={scroll === 'paper'}>
          <DialogContentText
            id="scroll-dialog-description"
            ref={descriptionElementRef}
            tabIndex={-1}
          >
            {help_text[0]}<br/><br/>
            {help_text[1]}<br/><br/>
            {help_text[2]}<br/><br/>
            {help_text[3]}<br/><br/>
            {help_text[4]}<br/><br/>
            {help_text[5]}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </label>
  );
}