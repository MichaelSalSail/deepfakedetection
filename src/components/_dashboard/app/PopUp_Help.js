import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

let help_text=[]
help_text[0]="- You may only upload .mp4 videos. Upload Video saves your file on the server for analysis."
help_text[1]="- The time it takes to generate results increases with video duration. \
                The backend is run locally, so make sure to conserve system resources \
                by closing any unnecessary applications."
help_text[2]="- Look at the raw data! Unless there are a significant number of missing frames, \
                the eye blink classification for each video frame is recorded on a .csv for \
                download."
help_text[3]="Troubleshooting: If the output didn't change upon clicking \'Generate Results\', \
              it's possible the program exceeded system resources and ended abruptly. If the base \
              model returned a score of 50%, the program possibly ran into exception \
              DefaultCPUAllocator, not enough available memory to run a prediction. \
              Both issues can be resolved by uploading a video w/ lower duration. \
              Other obscure errors can be caused by not installing libraries from the \
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
            {help_text[3]}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </label>
  );
}