import { Box, Container, Typography } from "@mui/material";
import RoomList from "../../components/rooms/RoomList";


export default function RoomsPage() {
return (
<Container maxWidth="lg" sx={{ py: 3 }}>
<Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>회의실 관리</Typography>
<Box sx={{ bgcolor: "background.paper", p: 2, borderRadius: 2, boxShadow: 1 }}>
<RoomList />
</Box>
</Container>
);
}