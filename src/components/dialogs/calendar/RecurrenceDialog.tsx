// src/components/dialogs/calendar/RecurrenceDialog.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Button, FormControl, InputLabel, Select, MenuItem,
  TextField, FormControlLabel, Switch, RadioGroup, Radio, Checkbox, Stack, Typography
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import type { RecurrenceRule, RecurrenceFrequency } from "../../../types/calendar/calendar";
import { generateOccurrences, summarizeRecurrence } from "../../../utils/calendar/recurrence";

const WEEKDAYS = [
  { v: 1, label: "월" },
  { v: 2, label: "화" },
  { v: 3, label: "수" },
  { v: 4, label: "목" },
  { v: 5, label: "금" },
  { v: 6, label: "토" },
  { v: 0, label: "일" },
];

type Props = {
  open: boolean;
  onClose: () => void;
  value: RecurrenceRule;
  onSubmit: (rule: RecurrenceRule) => void;
  anchorStart: Dayjs;  // 현재 이벤트 시작 (요일 기본값/미리보기 계산용)
  anchorEnd: Dayjs;    // 현재 이벤트 종료
};

function defaultRule(now: Dayjs): RecurrenceRule {
  return {
    enabled: true,
    freq: "WEEKLY",
    interval: 1,
    byWeekdays: [now.day()], // 현재 요일
    end: { mode: "COUNT", count: 10 },
    maxInstances: 200,
  };
}

export default function RecurrenceDialog({
  open, onClose, value, onSubmit, anchorStart, anchorEnd,
}: Props) {
  const [enabled, setEnabled] = useState(value.enabled ?? false);
  const [freq, setFreq] = useState<RecurrenceFrequency>(value.freq ?? "WEEKLY");
  const [interval, setInterval] = useState<number>(value.interval ?? 1);
  const [byWeekdays, setByWeekdays] = useState<number[]>(
    value.byWeekdays && value.byWeekdays.length > 0 ? value.byWeekdays : [anchorStart.day()]
  );
  const [endMode, setEndMode] = useState<"NEVER" | "UNTIL_DATE" | "COUNT">(value.end?.mode ?? "COUNT");
  const [untilDate, setUntilDate] = useState<Dayjs | null>(
    value.end?.mode === "UNTIL_DATE" ? dayjs(value.end.untilDate) : null
  );
  const [count, setCount] = useState<number>(
    value.end?.mode === "COUNT" ? value.end.count : 10
  );
  const [maxInstances, setMaxInstances] = useState<number>(value.maxInstances ?? 200);

  useEffect(() => {
    if (!open) return;
    // 다이얼로그 열릴 때 값 초기화(최초 생성 시 기본 규칙 제공)
    if (!value.enabled) {
      const d = defaultRule(anchorStart);
      setEnabled(d.enabled); setFreq(d.freq); setInterval(d.interval);
      setByWeekdays(d.byWeekdays!); setEndMode(d.end.mode as any); setCount(10); setUntilDate(null);
      setMaxInstances(d.maxInstances!);
    } else {
      setEnabled(value.enabled);
      setFreq(value.freq);
      setInterval(value.interval);
      setByWeekdays(value.byWeekdays ?? [anchorStart.day()]);
      setEndMode(value.end.mode as any);
      setUntilDate(value.end.mode === "UNTIL_DATE" ? dayjs(value.end.untilDate) : null);
      setCount(value.end.mode === "COUNT" ? value.end.count : 10);
      setMaxInstances(value.maxInstances ?? 200);
    }
  }, [open]); // eslint-disable-line

  // const endLabel = endMode === "NEVER" ? "끝없음"
  //   : endMode === "COUNT" ? `${count}회`
  //   : untilDate ? `${untilDate.format("YYYY-MM-DD")}까지` : "종료일 지정";

  const rulePreview: RecurrenceRule = useMemo(() => ({
    enabled,
    freq,
    interval: Math.max(1, Number(interval) || 1),
    byWeekdays: freq === "WEEKLY" ? byWeekdays : undefined,
    end:
      endMode === "NEVER" ? { mode: "NEVER" } :
      endMode === "COUNT" ? { mode: "COUNT", count: Math.max(1, Number(count) || 1) } :
      { mode: "UNTIL_DATE", untilDate: (untilDate ?? anchorStart).format("YYYY-MM-DD") },
    maxInstances: Math.max(1, Number(maxInstances) || 1),
  }), [enabled, freq, interval, byWeekdays, endMode, count, untilDate, anchorStart, maxInstances]);

  const previews = useMemo(() => {
    if (!enabled) return [];
    try {
      return generateOccurrences(rulePreview, anchorStart, anchorEnd);
    } catch { return []; }
  }, [rulePreview, enabled, anchorStart, anchorEnd]);

  const toggleWeekday = (d: number) =>
    setByWeekdays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const handleApply = () => {
    if (!enabled) {
      onSubmit({ enabled: false, freq: "WEEKLY", interval: 1, end: { mode: "NEVER" } });
      return;
    }
    // 유효성 간단 체크
    if (freq === "WEEKLY" && (!byWeekdays || byWeekdays.length === 0)) {
      alert("반복 요일을 1개 이상 선택하세요."); return;
    }
    onSubmit(rulePreview);
  };

  const handleReset = () => {
    setEnabled(false);
    setFreq("WEEKLY"); setInterval(1); setByWeekdays([anchorStart.day()]);
    setEndMode("COUNT"); setCount(10); setUntilDate(null); setMaxInstances(200);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>반복 등록</DialogTitle>
      <DialogContent sx={{ pt: 2, display: "grid", gap: 2 }}>
        <FormControlLabel
          control={<Switch checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />}
          label="반복 사용"
        />

        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, alignItems: "end" }}>
          <FormControl fullWidth>
            <InputLabel id="freq-label">반복 주기</InputLabel>
            <Select
              labelId="freq-label"
              label="반복 주기"
              value={freq}
              onChange={(e) => setFreq(e.target.value as RecurrenceFrequency)}
            >
              <MenuItem value="DAILY">일</MenuItem>
              <MenuItem value="WEEKLY">주</MenuItem>
              <MenuItem value="MONTHLY">개월</MenuItem>
              <MenuItem value="YEARLY">년</MenuItem>
            </Select>
          </FormControl>

          <TextField
            type="number"
            label="간격 (매 N 주기)"
            value={interval}
            inputProps={{ min: 1 }}
            onChange={(e) => setInterval(Math.max(1, Number(e.target.value) || 1))}
            fullWidth
          />
        </Box>

        {freq === "WEEKLY" && (
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>반복 요일</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {WEEKDAYS.map(d => (
                <FormControlLabel
                  key={d.v}
                  control={
                    <Checkbox
                      checked={byWeekdays.includes(d.v)}
                      onChange={() => toggleWeekday(d.v)}
                    />
                  }
                  label={d.label}
                />
              ))}
            </Stack>
          </Box>
        )}

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>종료</Typography>
          <RadioGroup
            row
            value={endMode}
            onChange={(e) => setEndMode(e.target.value as any)}
          >
            <FormControlLabel value="NEVER" control={<Radio />} label="끝없음" />
            <FormControlLabel value="COUNT" control={<Radio />} label="횟수" />
            <FormControlLabel value="UNTIL_DATE" control={<Radio />} label="날짜까지" />
          </RadioGroup>

          {endMode === "COUNT" && (
            <TextField
              type="number"
              label="총 횟수"
              value={count}
              onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))}
              sx={{ mt: 1 }}
              inputProps={{ min: 1 }}
            />
          )}

          {endMode === "UNTIL_DATE" && (
            <DatePicker
              label="종료일"
              value={untilDate}
              onChange={(v) => setUntilDate(v)}
              sx={{ mt: 1 }}
            />
          )}
        </Box>

        <Box sx={{ mt: 1, p: 1, border: "1px dashed #d1d5db", borderRadius: 1, bgcolor: "#fafafa" }}>
          <Typography variant="body2">
            {enabled ? `설정: ${summarizeRecurrence(rulePreview)}` : "반복 사용 안 함"}
          </Typography>
          {enabled && (
            <Typography variant="body2" color="text.secondary">
              미리보기: 총 {previews.length}건 생성 예정 (최대 {rulePreview.maxInstances ?? 200}건)
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleReset}>초기화</Button>
        <Button onClick={onClose}>취소</Button>
        <Button variant="contained" onClick={handleApply}>적용</Button>
      </DialogActions>
    </Dialog>
  );
}
