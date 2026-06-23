import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import { alpha, Box, Card, CardContent, Typography } from "@mui/material";

// ----------------------------------------------------------------------

const dashedBorderSx = {
  border: "1px dashed",
  borderColor: (theme) => alpha(theme.palette.info.main, 0.45),
};

function FramePlaceholder({ label, variant = "collage" }) {
  const isSubject = variant === "subject";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: isSubject ? "0 0 auto" : 1,
        minHeight: isSubject ? 0 : 72,
        alignItems: "stretch",
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        fontWeight="medium"
        sx={{ mb: 0.5, display: "block", textTransform: "uppercase", letterSpacing: 0.5 }}
      >
        {label}
      </Typography>
      {isSubject ? (
        <Box
          sx={{
            width: "100%",
            bgcolor: "common.white",
            display: "flex",
            justifyContent: "center",
            py: 0.25,
          }}
        >
          <Box
            sx={{
              width: 56,
              height: 56,
              flexShrink: 0,
              borderRadius: 1.5,
              ...dashedBorderSx,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.25,
              px: 0.5,
            }}
          >
            <ImageOutlinedIcon
              sx={{
                fontSize: 18,
                color: (theme) => alpha(theme.palette.info.dark, 0.5),
              }}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              align="center"
              sx={{ lineHeight: 1.2, fontSize: "0.6rem" }}
            >
              Subject crop
            </Typography>
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            flex: 1,
            minHeight: 72,
            width: "100%",
            borderRadius: 1.5,
            bgcolor: "common.white",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 0.5,
            px: 1,
            ...dashedBorderSx,
          }}
        >
          <ImageOutlinedIcon
            sx={{
              fontSize: 28,
              color: (theme) => alpha(theme.palette.info.dark, 0.5),
            }}
          />
          <Typography
            variant="caption"
            color="text.secondary"
            align="center"
            sx={{ lineHeight: 1.3, fontSize: "0.7rem" }}
          >
            Frame Collage
          </Typography>
        </Box>
      )}
    </Box>
  );
}

// ----------------------------------------------------------------------

export default function GeminiFrameAnalysis() {
  return (
    <Card
      sx={{
        width: "100%",
        bgcolor: (theme) => alpha(theme.palette.info.light, 0.35),
        border: "1px solid",
        borderColor: (theme) => alpha(theme.palette.info.main, 0.35),
        boxShadow: (theme) => `0 4px 20px ${alpha(theme.palette.info.main, 0.12)}`,
      }}
    >
      <CardContent sx={{ py: 2, px: 2, "&:last-child": { pb: 2 } }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: { xs: 2, md: 2.5 },
            alignItems: "stretch",
            minHeight: { md: 300 },
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
              flexShrink: 0,
              width: { xs: "100%", md: 176 },
              minHeight: { md: 300 },
            }}
          >
            <FramePlaceholder label="Subject" variant="subject" />
            <FramePlaceholder label="Video Summary" variant="collage" />
            <FramePlaceholder label="Eye Blink Example" variant="collage" />
          </Box>

          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              borderRadius: 1.5,
              bgcolor: "common.white",
              border: "1px solid",
              borderColor: (theme) => alpha(theme.palette.info.main, 0.2),
              px: 2,
              py: 1.5,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ mb: 1, display: "block" }}
            >
              AI output
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontStyle: "italic",
                lineHeight: 1.65,
                opacity: 0.72,
              }}
            >
              Gemini will review the full scene frame and the cropped subject frame to describe
              what it sees — setting, eyewear reflections, facial details, and signs of
              manipulation or AI generation. Results will appear here after analysis.
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
