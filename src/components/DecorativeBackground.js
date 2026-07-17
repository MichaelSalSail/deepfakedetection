import { Box } from "@mui/material";

// ----------------------------------------------------------------------
// Scattered squares echoing the pixelation motif in the app logo: a broad
// band across the top of the page (behind the title/buttons/log area) and
// a denser clump filling the empty bottom-right space. Two-tone blue,
// reusing the theme's SECONDARY.light/main (src/theme/palette.js) rather
// than new hex values.
//
// Positions are hardcoded (not generated) so individual squares can be
// deleted by hand — just remove a line from TOP_BAND or BOTTOM_RIGHT_CLUMP.

const BLUE_LIGHT = "#84A9FF"; // theme SECONDARY.light
const BLUE_MAIN = "#3366FF"; // theme SECONDARY.main

// pinned to the logo + title row height (src/pages/DashboardApp.js:524-548)
const TOP_BAND = [
  { top: "14px", left: "1.58%", size: 9, color: BLUE_LIGHT, opacity: 0.206 },
  { top: "30px", left: "3.74%", size: 9, color: BLUE_MAIN, opacity: 0.204 },
  { top: "11px", left: "5.29%", size: 11, color: BLUE_MAIN, opacity: 0.172 },
  { top: "22px", left: "8.99%", size: 10, color: BLUE_MAIN, opacity: 0.234 },
  { top: "8px", left: "11.28%", size: 11, color: BLUE_LIGHT, opacity: 0.201 },
  { top: "30px", left: "13.41%", size: 11, color: BLUE_MAIN, opacity: 0.238 },
  { top: "21px", left: "17.08%", size: 10, color: BLUE_LIGHT, opacity: 0.175 },
  { top: "8px", left: "18.57%", size: 10, color: BLUE_MAIN, opacity: 0.124 },
  { top: "30px", left: "20.70%", size: 9, color: BLUE_MAIN, opacity: 0.166 },
  { top: "10px", left: "23.09%", size: 11, color: BLUE_MAIN, opacity: 0.258 },
  { top: "30px", left: "25.84%", size: 9, color: BLUE_LIGHT, opacity: 0.167 },
  { top: "10px", left: "29.00%", size: 11, color: BLUE_LIGHT, opacity: 0.165 },
  { top: "30px", left: "32.38%", size: 10, color: BLUE_MAIN, opacity: 0.149 },
  { top: "30px", left: "62.57%", size: 10, color: BLUE_LIGHT, opacity: 0.223 },
  { top: "10px", left: "65.99%", size: 9, color: BLUE_MAIN, opacity: 0.25 },
  { top: "30px", left: "68.66%", size: 10, color: BLUE_LIGHT, opacity: 0.186 },
  { top: "30px", left: "70.83%", size: 11, color: BLUE_MAIN, opacity: 0.144 },
  { top: "11px", left: "73.74%", size: 9, color: BLUE_MAIN, opacity: 0.247 },
  { top: "30px", left: "75.62%", size: 10, color: BLUE_MAIN, opacity: 0.161 },
  { top: "6px", left: "78.59%", size: 11, color: BLUE_LIGHT, opacity: 0.187 },
  { top: "17px", left: "81.27%", size: 9, color: BLUE_MAIN, opacity: 0.165 },
  { top: "30px", left: "84.31%", size: 9, color: BLUE_MAIN, opacity: 0.245 },
  { top: "30px", left: "88.21%", size: 10, color: BLUE_LIGHT, opacity: 0.148 },
  { top: "15px", left: "90.80%", size: 9, color: BLUE_MAIN, opacity: 0.245 },
  { top: "30px", left: "93.52%", size: 11, color: BLUE_LIGHT, opacity: 0.218 },
  { top: "15px", left: "96.00%", size: 9, color: BLUE_MAIN, opacity: 0.245 },
  { top: "30px", left: "98.37%", size: 10, color: BLUE_MAIN, opacity: 0.139 },
];

// pinned to roughly the "Tips for Spotting Deepfakes" section height
// (src/pages/DashboardApp.js:1071-1090), the last section on the page
const BOTTOM_RIGHT_CLUMP = [
  { bottom: "370px", left: "62.57%", size: 10, color: BLUE_LIGHT, opacity: 0.223 },
  { bottom: "350px", left: "65.99%", size: 9, color: BLUE_MAIN, opacity: 0.25 },
  { bottom: "370px", left: "68.66%", size: 10, color: BLUE_LIGHT, opacity: 0.186 },
  { bottom: "370px", left: "70.83%", size: 11, color: BLUE_MAIN, opacity: 0.144 },
  { bottom: "351px", left: "73.74%", size: 9, color: BLUE_MAIN, opacity: 0.247 },
  { bottom: "370px", left: "75.62%", size: 10, color: BLUE_MAIN, opacity: 0.161 },
  { bottom: "336px", left: "78.59%", size: 11, color: BLUE_LIGHT, opacity: 0.187 },
  { bottom: "357px", left: "81.27%", size: 9, color: BLUE_MAIN, opacity: 0.165 },
  { bottom: "370px", left: "84.31%", size: 9, color: BLUE_MAIN, opacity: 0.245 },
  { bottom: "370px", left: "88.21%", size: 10, color: BLUE_LIGHT, opacity: 0.148 },
  { bottom: "355px", left: "90.80%", size: 9, color: BLUE_MAIN, opacity: 0.245 },
  { bottom: "370px", left: "93.52%", size: 11, color: BLUE_LIGHT, opacity: 0.218 },
  { bottom: "355px", left: "96.00%", size: 9, color: BLUE_MAIN, opacity: 0.245 },
  { bottom: "370px", left: "98.37%", size: 10, color: BLUE_MAIN, opacity: 0.139 },
  
  { bottom: "6px", right: "0.00%", size: 9, color: BLUE_MAIN, opacity: 0.131 },
  { bottom: "43px", right: "0.02%", size: 10, color: BLUE_MAIN, opacity: 0.236 },
  { bottom: "86px", right: "0.08%", size: 11, color: BLUE_LIGHT, opacity: 0.139 },
  { bottom: "140px", right: "0.14%", size: 9, color: BLUE_MAIN, opacity: 0.227 },
  { bottom: "180px", right: "1.77%", size: 11, color: BLUE_LIGHT, opacity: 0.191 },
  { bottom: "248px", right: "2.83%", size: 10, color: BLUE_MAIN, opacity: 0.254 },
  { bottom: "0px", right: "2.92%", size: 11, color: BLUE_LIGHT, opacity: 0.257 },
  { bottom: "58px", right: "4.41%", size: 9, color: BLUE_LIGHT, opacity: 0.201 },
  { bottom: "1px", right: "5.49%", size: 10, color: BLUE_MAIN, opacity: 0.21 },
  { bottom: "146px", right: "7.09%", size: 9, color: BLUE_MAIN, opacity: 0.235 },
  { bottom: "243px", right: "7.41%", size: 9, color: BLUE_LIGHT, opacity: 0.251 },
  { bottom: "39px", right: "7.99%", size: 11, color: BLUE_MAIN, opacity: 0.176 },
  { bottom: "95px", right: "8.89%", size: 10, color: BLUE_LIGHT, opacity: 0.263 },
  { bottom: "142px", right: "10.72%", size: 9, color: BLUE_LIGHT, opacity: 0.193 },
  { bottom: "75px", right: "11.26%", size: 9, color: BLUE_MAIN, opacity: 0.19 },
  { bottom: "180px", right: "12.09%", size: 11, color: BLUE_MAIN, opacity: 0.207 },
  { bottom: "123px", right: "12.93%", size: 11, color: BLUE_LIGHT, opacity: 0.199 },
  { bottom: "100px", right: "15.96%", size: 11, color: BLUE_MAIN, opacity: 0.216 },
  { bottom: "52px", right: "16.26%", size: 11, color: BLUE_MAIN, opacity: 0.279 },
  { bottom: "174px", right: "18.44%", size: 10, color: BLUE_MAIN, opacity: 0.264 },
  { bottom: "126px", right: "20.53%", size: 10, color: BLUE_MAIN, opacity: 0.151 },
  { bottom: "200px", right: "22.44%", size: 11, color: BLUE_LIGHT, opacity: 0.131 },
  { bottom: "96px", right: "24.91%", size: 11, color: BLUE_LIGHT, opacity: 0.132 },
  { bottom: "45px", right: "27.44%", size: 11, color: BLUE_MAIN, opacity: 0.134 },
  { bottom: "40px", right: "21.76%", size: 9, color: BLUE_LIGHT, opacity: 0.271 },
  { bottom: "143px", right: "28.91%", size: 9, color: BLUE_MAIN, opacity: 0.171 },
  { bottom: "122px", right: "31.12%", size: 11, color: BLUE_LIGHT, opacity: 0.166 },
  { bottom: "82px", right: "32.94%", size: 9, color: BLUE_MAIN, opacity: 0.143 },
  { bottom: "25px", right: "35.36%", size: 10, color: BLUE_MAIN, opacity: 0.247 },
  { bottom: "101px", right: "38.15%", size: 11, color: BLUE_LIGHT, opacity: 0.174 },
];

const SQUARES = [...TOP_BAND, ...BOTTOM_RIGHT_CLUMP];

export default function DecorativeBackground() {
  return (
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      {SQUARES.map((square, index) => (
        <Box
          key={index}
          sx={{
            position: "absolute",
            top: square.top,
            left: square.left,
            right: square.right,
            bottom: square.bottom,
            width: square.size,
            height: square.size,
            borderRadius: "2px",
            backgroundColor: square.color,
            opacity: square.opacity,
          }}
        />
      ))}
    </Box>
  );
}
