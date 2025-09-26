import { Box, Typography } from "@mui/material";
import RoomList from "../../components/rooms/RoomList";

export default function RoomsPage() {
  return (
    // 사이드바 폭만큼 좌측 오프셋 (md 이상)
    <Box
      sx={{
        py: 3,
        px: { xs: 2, md: 3 },
        ml: { md: "var(--sidebar-width, 150px)" },
      }}
    >
      {/* 가운데 정렬 + 최대 폭 */}
      <Box
        sx={{
          width: "100%",
          maxWidth: { xs: "100%", lg: 1440, xl: 1680 },
          mx: "auto",
        }}
      >
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
          회의실 관리
        </Typography>

        <Box
          sx={{
            mt: 3,
            bgcolor: "background.paper",
            p: 2,
            borderRadius: 2,
            boxShadow: 1,
          }}
        >
          <RoomList />
        </Box>
      </Box>
    </Box>
  );
}
