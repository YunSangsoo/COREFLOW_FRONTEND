// c:/FinalProject_Front/src/components/rooms/RoomDetailDialog.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PlaceIcon from '@mui/icons-material/Place';
import GroupIcon from '@mui/icons-material/Group';
import dayjs, { Dayjs } from 'dayjs';
import { useSelector } from 'react-redux';
// ✅ TS verbitamModuleSyntax 대응: type-only import
import type { RootState } from '../../store/store';

// ✅ 기존 room API 재사용
import { fetchRoomDetail, deleteRoom } from '../../api/roomApi';
import type { RoomDetailRes, RoomReservationRes } from '../../types/rooms/room';
import { api } from '../../api/coreflowApi';

export interface RoomDetailDialogProps {
    open: boolean;
    roomId: number | null;
    from?: string | Dayjs;
    to?: string | Dayjs;
    onClose: () => void;
    onOpenEventDetail?: (eventId: number) => void;
    /** 수정 시작(생성 모달 재사용) - roomId만 넘겨주면 모달 내부에서 상세 조회 */
    onEditRoom?: (roomId: number) => void;
    /** 삭제 후 상위 리스트 리프레시 등 후처리 */
    onDeleted?: (roomId: number) => void;
}

// 공백 포맷 (백엔드 상세조회와 일치)
const SPACE_FMT = 'YYYY-MM-DD HH:mm:ss';

// ⬇️⬇️ [추가] URL 유틸 2개 (중복 /api/ 정리 & 파일명 추출)
const fixDoubleApi = (u: string) => (u || '').replace(/\/api\/api\//i, '/api/');
const extractFilename = (u?: string | null) => {
    if (!u) return '';
    const cleaned = fixDoubleApi(u).split('#')[0].split('?')[0];
    const path = cleaned.replace(/^https?:\/\/[^/]+/i, '');
    try {
        return decodeURIComponent(path.split('/').pop() || '');
    } catch {
        return path.split('/').pop() || '';
    }
};
// ⬆️⬆️ [추가 끝]

function toSpaceString(v: string | Dayjs | undefined, fallback: Dayjs): string {
    if (!v) return fallback.format(SPACE_FMT);
    if (typeof v === 'string') return v;
    return (v as Dayjs).format(SPACE_FMT);
}

function formatRange(start: string, end: string) {
    const s = dayjs(start), e = dayjs(end);
    const sameDay = s.isSame(e, 'day');
    if (sameDay) return `${s.format('YYYY-MM-DD')} ${s.format('HH:mm')} ~ ${e.format('HH:mm')}`;
    return `${s.format('YYYY-MM-DD HH:mm')} ~ ${e.format('YYYY-MM-DD HH:mm')}`;
}

const RoomDetailDialog: React.FC<RoomDetailDialogProps> = ({
    open,
    roomId,
    from,
    to,
    onClose,
    onOpenEventDetail,
    onEditRoom,
    onDeleted,
}) => {
    const defaultFrom = useMemo(() => dayjs().startOf('day'), []);
    const defaultTo = useMemo(() => dayjs().startOf('day').add(7, 'day'), []);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<RoomDetailRes | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fromStr = toSpaceString(from, defaultFrom);
    const toStr = toSpaceString(to, defaultTo);

    // 권한: ROLE_ADMIN | ROLE_HR 만 수정/삭제 버튼 노출
    const roles = useSelector((s: RootState) => s.auth.user?.roles ?? []);
    const isAdmin = useMemo(() => {
        const set = new Set((roles as string[]).map((r) => String(r).toUpperCase()));
        return set.has('ROLE_ADMIN') || set.has('ROLE_HR') || set.has('ADMIN') || set.has('HR');
    }, [roles]);

    useEffect(() => {
        if (!open || !roomId) return;

        let mounted = true;
        setLoading(true);
        setError(null);

        fetchRoomDetail(roomId, { from: fromStr, to: toStr })
            .then((res) => {
                if (!mounted) return;
                setData(res);
            })
            .catch((e: any) => {
                if (!mounted) return;
                const msg = e?.message || '회의실 상세 조회 중 오류가 발생했습니다.';
                setError(msg);
            })
            .finally(() => mounted && setLoading(false));

        return () => { mounted = false; };
    }, [open, roomId, fromStr, toStr]);

    // ⬇️⬇️ [추가] 상세 도면(SVG) 미리보기 로직
    const detailRaw = data?.description || '';
    const detailFixed = useMemo(() => fixDoubleApi(detailRaw), [detailRaw]);
    const previewFilename = useMemo(() => extractFilename(detailFixed), [detailFixed]);
    const previewPath = useMemo(
        () => (previewFilename ? `/rooms/floormaps/${encodeURIComponent(previewFilename)}` : ''),
        [previewFilename]
    );

    const [svgMarkup, setSvgMarkup] = useState('');
    const [svgErr, setSvgErr] = useState<string | null>(null);

    useEffect(() => {
        if (!open || !previewPath) { setSvgMarkup(''); setSvgErr(null); return; }
        api.get<string>(previewPath, { responseType: 'text' as any, headers: { Accept: 'image/svg+xml' } })
            .then(res => { setSvgErr(null); setSvgMarkup(res.data as unknown as string); })
            .catch(e => { setSvgMarkup(''); setSvgErr(`도면을 불러오지 못했습니다. (${e?.response?.status || ''} ${e?.message || e})`); });
    }, [open, previewPath]);
    // ⬆️⬆️ [추가 끝]

    const handleEdit = () => {
        if (!roomId || !onEditRoom) return;
        onEditRoom(roomId);
    };

    const handleDelete = async () => {
        if (!roomId) return;
        if (!window.confirm('이 회의실을 삭제하시겠습니까? 되돌릴 수 없습니다.')) return;
        try {
            setDeleting(true);
            await deleteRoom(roomId);
            onDeleted?.(roomId);
            onClose();
        } catch (e: any) {
            const status = e?.response?.status;
            const msg =
                status === 401 || status === 403
                    ? '권한이 없습니다.'
                    : e?.response?.data?.message || e?.message || '회의실 삭제 중 오류가 발생했습니다.';
            setError(msg);
        } finally {
            setDeleting(false);
        }
    };

    const reservations = data?.reservations ?? [];

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle sx={{ pr: 6 }}>
                회의실 상세
                <IconButton aria-label="close" onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent dividers>
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                        <CircularProgress />
                    </Box>
                )}

                {!loading && error && (
                    <Typography color="error" variant="body2">
                        {error}
                    </Typography>
                )}

                {!loading && !error && data && (
                    <Stack spacing={2}>
                        {/* 기본 정보 */}
                        <Box>
                            <Typography variant="h6" sx={{ mb: 0.5 }}>
                                {data.roomName}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                                <PlaceIcon fontSize="small" />
                                <Typography variant="body2" sx={{ mr: 1 }}>
                                    {data.location ?? '-'}
                                </Typography>
                                <GroupIcon fontSize="small" />
                                <Typography variant="body2" sx={{ mr: 1 }}>
                                    정원 {data.capacity ?? '-'}명
                                </Typography>
                                {data.equipments &&
                                    data.equipments.split(',').map((eq) => (
                                        <Chip key={eq.trim()} size="small" label={eq.trim()} sx={{ mr: 0.5 }} />
                                    ))}
                            </Stack>
                            {data.description && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    {data.description}
                                </Typography>
                            )}

                            {/* ⬇️⬇️ [추가] 상세 도면 미리보기 (인라인 SVG) */}
                            {previewFilename && (
                                <Box sx={{ mt: 2 }}>
                                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                                        상세 도면
                                    </Typography>
                                    {svgErr && (
                                        <Typography variant="body2" color="error" sx={{ mb: 1 }}>
                                            {svgErr}
                                        </Typography>
                                    )}
                                    <Box sx={{ border: '1px dashed #ccc', borderRadius: 1, p: 1, maxHeight: 420, overflow: 'auto' }}>
                                        <div key={previewFilename} dangerouslySetInnerHTML={{ __html: svgMarkup }} />
                                    </Box>
                                    <style>{`div svg { max-width: 100%; height: auto; }`}</style>
                                </Box>
                            )}
                            {/* ⬆️⬆️ [추가 끝] */}
                        </Box>

                        <Divider />

                        {/* 조회 기간 */}
                        <Stack direction="row" spacing={1} alignItems="center">
                            <CalendarMonthIcon fontSize="small" />
                            <Typography variant="body2">
                                {dayjs(fromStr).format('YYYY-MM-DD')} ~ {dayjs(toStr).format('YYYY-MM-DD')}
                            </Typography>
                        </Stack>

                        {/* 예약 목록 */}
                        <Box>
                            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                                예약 현황
                            </Typography>
                            {reservations.length === 0 ? (
                                <Typography variant="body2" color="text.secondary">
                                    해당 기간 예약이 없습니다.
                                </Typography>
                            ) : (
                                <List dense disablePadding>
                                    {reservations.map((r: RoomReservationRes) => (
                                        <ListItem
                                            key={`${r.eventId}-${r.startAt}`}
                                            divider
                                            secondaryAction={
                                                onOpenEventDetail ? (
                                                    <Button size="small" onClick={() => onOpenEventDetail?.(r.eventId)}>
                                                        상세
                                                    </Button>
                                                ) : null
                                            }
                                        >
                                            <ListItemText
                                                primary={
                                                    <Stack direction="row" spacing={1} alignItems="center">
                                                        <Tooltip title={r.calendarName}>
                                                            <Chip size="small" label={r.calendarName} />
                                                        </Tooltip>
                                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                            {r.title}
                                                        </Typography>
                                                    </Stack>
                                                }
                                                primaryTypographyProps={{ component: 'div' }}          // ✅ 추가
                                                secondary={
                                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                                                        <AccessTimeIcon fontSize="small" />
                                                        <Typography variant="caption" color="text.secondary">
                                                            {formatRange(r.startAt, r.endAt)}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                                            주최: {r.organizerName ?? r.organizerUserNo}
                                                        </Typography>
                                                    </Stack>
                                                }
                                                secondaryTypographyProps={{ component: 'div' }}        // ✅ 추가
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </Box>
                    </Stack>
                )}
            </DialogContent>

            <DialogActions>
                {/* 관리자만 수정/삭제 버튼 노출 */}
                {isAdmin && (
                    <>
                        <Button onClick={handleEdit} disabled={!roomId}>
                            수정
                        </Button>
                        <Button color="error" onClick={handleDelete} disabled={!roomId || deleting}>
                            {deleting ? '삭제 중...' : '삭제'}
                        </Button>
                    </>
                )}
                <Button onClick={onClose} startIcon={<CloseIcon />}>
                    닫기
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default RoomDetailDialog;
