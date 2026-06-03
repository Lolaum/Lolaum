"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Alert,
  Box,
  Button,
  CssBaseline,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  FormControlLabel,
  Stack,
  Switch,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  MenuItem,
  TextField,
  ThemeProvider,
  Typography,
  createTheme,
} from "@mui/material";
import {
  adminLogin,
  adminSignup,
  getAdminDashboardData,
  resolveErrorLog,
  setUserDeactivated,
  upsertChallengePeriod,
  upsertReviewQuestion,
  type AdminDashboardData,
  type AdminExportRow,
} from "@/api/admin";

type Initial = Awaited<ReturnType<typeof getAdminDashboardData>>;

const adminTheme = createTheme({
  palette: {
    primary: { main: "#eab32e", dark: "#c99315", contrastText: "#ffffff" },
    secondary: { main: "#ff9c28" },
    background: { default: "#fef7e6", paper: "#ffffff" },
  },
  shape: { borderRadius: 18 },
  typography: { fontFamily: "Arial, Helvetica, sans-serif" },
});

const defaultQuestions = [
  { reviewType: "mid" as const, questionKey: "why_started", label: "처음 시작한 이유", helperText: "초심을 점검하는 질문", sortOrder: 10, isActive: true },
  { reviewType: "mid" as const, questionKey: "keep_doing", label: "계속 유지할 것", helperText: "효과가 있었던 행동", sortOrder: 20, isActive: true },
  { reviewType: "mid" as const, questionKey: "will_change", label: "바꿔볼 것", helperText: "다음 주기 개선점", sortOrder: 30, isActive: true },
  { reviewType: "final" as const, questionKey: "results", label: "가장 큰 결과", helperText: "이번 리추얼의 성과", sortOrder: 10, isActive: true },
  { reviewType: "final" as const, questionKey: "life_changes", label: "생활의 변화", helperText: "몸/마음/생활 변화", sortOrder: 20, isActive: true },
  { reviewType: "final" as const, questionKey: "feedback", label: "다음 운영 피드백", helperText: "관리자가 볼 피드백", sortOrder: 30, isActive: true },
];

function toCsv(rows: AdminExportRow[]) {
  const headers = ["userId", "name", "username", "email", "challengeId", "periodId", "routineType", "recordCount", "createdAt"];
  const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  return [headers.join(","), ...rows.map((row) => headers.map((key) => escape(row[key as keyof AdminExportRow])).join(","))].join("\n");
}

function downloadFile(filename: string, body: string, type: string) {
  const blob = new Blob([body], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadCsv(rows: AdminExportRow[]) {
  downloadFile("lolaum-admin-export.csv", `\uFEFF${toCsv(rows)}`, "text/csv;charset=utf-8");
}

function downloadExcel(rows: AdminExportRow[]) {
  const table = toCsv(rows)
    .split("\n")
    .map((line) => `<tr>${line.split(",").map((cell) => `<td>${cell.replace(/^"|"$/g, "")}</td>`).join("")}</tr>`)
    .join("");
  downloadFile("lolaum-admin-export.xls", `<table>${table}</table>`, "application/vnd.ms-excel;charset=utf-8");
}

function AuthPanel({ onReload }: { onReload: () => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    setMessage(null);
    startTransition(async () => {
      const result = mode === "login"
        ? await adminLogin({ email, password })
        : await adminSignup({ username, email, password, inviteCode });
      if ("error" in result && result.error) {
        setMessage(result.error);
        return;
      }
      setMessage(mode === "login" ? "관리자 로그인 완료" : "관리자 가입 완료. 로그인해주세요.");
      if (mode === "login") onReload();
    });
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Card sx={{ borderRadius: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={1} sx={{ alignItems: "center", mb: 3 }}>
            <Box component="img" src="/images/common/LolaumLogoWeb.png" alt="Lolaum" sx={{ width: 180, maxWidth: "70%" }} />
            <Typography variant="h4" sx={{ fontWeight: 800 }}>Lolaum Admin</Typography>
            <Typography color="text.secondary">관리자 이메일 허용 목록과 초대 코드로 보호됩니다.</Typography>
          </Stack>
          <Tabs value={mode} onChange={(_, value) => setMode(value)} sx={{ mb: 3 }}>
            <Tab value="login" label="로그인" />
            <Tab value="signup" label="관리자 가입" />
          </Tabs>
          <Stack spacing={2}>
            {mode === "signup" && <TextField label="닉네임" value={username} onChange={(e) => setUsername(e.target.value)} />}
            <TextField label="이메일" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <TextField label="비밀번호" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            {mode === "signup" && <TextField label="관리자 가입 코드" type="password" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} />}
            {message && <Alert severity={message.includes("완료") ? "success" : "error"}>{message}</Alert>}
            <Button disabled={isPending} size="large" variant="contained" onClick={submit}>{isPending ? "처리 중..." : mode === "login" ? "관리자 로그인" : "관리자 가입"}</Button>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}

export default function AdminPageClient({ initial }: { initial: Initial }) {
  const [data, setData] = useState<AdminDashboardData | undefined>(initial.data);
  const [error, setError] = useState(initial.error ?? "");
  const [tab, setTab] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [period, setPeriod] = useState({ label: "", startDate: "", endDate: "", isActive: true });
  const [reasonByUser, setReasonByUser] = useState<Record<string, string>>({});
  const [question, setQuestion] = useState(defaultQuestions[0]);

  const reload = () => startTransition(async () => {
    const next = await getAdminDashboardData();
    setData(next.data);
    setError(next.error ?? "");
  });

  const stats = useMemo(() => ({
    activePeriods: data?.periods.filter((p) => p.is_active).length ?? 0,
    users: data?.users.length ?? 0,
    deactivated: data?.users.filter((u) => u.deactivated).length ?? 0,
    logs: data?.errorLogs.filter((log) => !log.resolved_at).length ?? 0,
  }), [data]);

  if (!data) return (
    <ThemeProvider theme={adminTheme}>
      <CssBaseline />
      <AuthPanel onReload={reload} />
    </ThemeProvider>
  );


  const displayedQuestions: Array<{
    id: string;
    review_type: "mid" | "final";
    question_key: string;
    label: string;
    helper_text: string | null;
    sort_order: number;
    is_active: boolean;
    updated_at: string;
  }> = data.reviewQuestions.length
    ? data.reviewQuestions
    : defaultQuestions.map((q) => ({
        id: q.questionKey,
        review_type: q.reviewType,
        question_key: q.questionKey,
        helper_text: q.helperText,
        sort_order: q.sortOrder,
        is_active: q.isActive,
        label: q.label,
        updated_at: "기본값",
      }));

  return (
    <ThemeProvider theme={adminTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", bgcolor: "#f7f4ec", py: 4 }}>
      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { xs: "flex-start", sm: "center" } }}>
            <Box component="img" src="/images/common/LolaumLogoWeb.png" alt="Lolaum" sx={{ width: 160 }} />
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 900 }}>Lolaum Admin</Typography>
              <Typography color="text.secondary">{data.adminEmail} · 리추얼 운영 대시보드</Typography>
            </Box>
          </Stack>
          {error && <Alert severity="error">{error}</Alert>}
          {data.unsupportedTables.length > 0 && (
            <Alert severity="warning">
              Supabase에 선택 admin 테이블이 아직 없습니다: {data.unsupportedTables.join(", ")}. UI는 표시되지만 해당 기능 저장은 테이블 생성 후 활성화됩니다.
            </Alert>
          )}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
            {[ ["활성 기간", stats.activePeriods], ["사용자", stats.users], ["비활성 사용자", stats.deactivated], ["미해결 로그", stats.logs] ].map(([label, value]) => (
              <Box key={label}>
                <Card><CardContent><Typography color="text.secondary">{label}</Typography><Typography variant="h4" sx={{ fontWeight: 800 }}>{value}</Typography></CardContent></Card>
              </Box>
            ))}
          </Box>
          <Card>
            <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable">
              <Tab label="리추얼 기간" /><Tab label="비활성 사용자" /><Tab label="회고 질문" /><Tab label="오류 로그" /><Tab label="다운로드" />
            </Tabs>
            <Divider />
            <CardContent>
              {tab === 0 && <Stack spacing={2}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>리추얼 기간 관리</Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
                  <Box><TextField fullWidth label="라벨" value={period.label} onChange={(e) => setPeriod({ ...period, label: e.target.value })} /></Box>
                  <Box><TextField fullWidth type="date" label="시작일" slotProps={{ inputLabel: { shrink: true } }} value={period.startDate} onChange={(e) => setPeriod({ ...period, startDate: e.target.value })} /></Box>
                  <Box><TextField fullWidth type="date" label="종료일" slotProps={{ inputLabel: { shrink: true } }} value={period.endDate} onChange={(e) => setPeriod({ ...period, endDate: e.target.value })} /></Box>
                  <Box><FormControlLabel control={<Switch checked={period.isActive} onChange={(e) => setPeriod({ ...period, isActive: e.target.checked })} />} label="활성화" /></Box>
                </Box>
                <Button variant="contained" disabled={isPending} onClick={() => startTransition(async () => { const res = await upsertChallengePeriod(period); if (res.error) setError(res.error); else reload(); })}>기간 저장</Button>
                <TableContainer><Table size="small"><TableHead><TableRow><TableCell>라벨</TableCell><TableCell>시작</TableCell><TableCell>종료</TableCell><TableCell>상태</TableCell></TableRow></TableHead><TableBody>{data.periods.map((p) => <TableRow key={p.id}><TableCell>{p.label ?? "-"}</TableCell><TableCell>{p.start_date}</TableCell><TableCell>{p.end_date}</TableCell><TableCell><Chip label={p.is_active ? "active" : "inactive"} color={p.is_active ? "success" : "default"} /></TableCell></TableRow>)}</TableBody></Table></TableContainer>
              </Stack>}
              {tab === 1 && <Stack spacing={2}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>사용자 비활성화 · 리추얼 추가 차단</Typography>
                <TableContainer><Table size="small"><TableHead><TableRow><TableCell>사용자</TableCell><TableCell>이메일</TableCell><TableCell>리추얼</TableCell><TableCell>상태</TableCell><TableCell>사유</TableCell><TableCell>액션</TableCell></TableRow></TableHead><TableBody>{data.users.map((u) => <TableRow key={u.id}><TableCell>{u.name} ({u.username})</TableCell><TableCell>{u.email}</TableCell><TableCell>{u.routineCount}</TableCell><TableCell><Chip label={u.deactivated ? "차단" : "정상"} color={u.deactivated ? "error" : "success"} /></TableCell><TableCell><TextField size="small" value={reasonByUser[u.id] ?? u.deactivated?.reason ?? ""} onChange={(e) => setReasonByUser({ ...reasonByUser, [u.id]: e.target.value })} /></TableCell><TableCell><Button size="small" disabled={isPending} onClick={() => startTransition(async () => { const res = await setUserDeactivated({ userId: u.id, reason: reasonByUser[u.id] ?? "", deactivated: !u.deactivated }); if (res.error) setError(res.error); else reload(); })}>{u.deactivated ? "해제" : "차단"}</Button></TableCell></TableRow>)}</TableBody></Table></TableContainer>
              </Stack>}
              {tab === 2 && <Stack spacing={2}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>중간/최종 회고 질문 편집</Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
                  <Box><TextField select fullWidth label="종류" value={question.reviewType} onChange={(e) => setQuestion({ ...question, reviewType: e.target.value as "mid" | "final" })}><MenuItem value="mid">중간</MenuItem><MenuItem value="final">최종</MenuItem></TextField></Box>
                  <Box><TextField fullWidth label="키" value={question.questionKey} onChange={(e) => setQuestion({ ...question, questionKey: e.target.value })} /></Box>
                  <Box><TextField fullWidth label="질문 라벨" value={question.label} onChange={(e) => setQuestion({ ...question, label: e.target.value })} /></Box>
                  <Box><TextField fullWidth label="도움말" value={question.helperText} onChange={(e) => setQuestion({ ...question, helperText: e.target.value })} /></Box>
                  <Box><TextField fullWidth type="number" label="순서" value={question.sortOrder} onChange={(e) => setQuestion({ ...question, sortOrder: Number(e.target.value) })} /></Box>
                </Box>
                <Button variant="contained" disabled={isPending} onClick={() => startTransition(async () => { const res = await upsertReviewQuestion(question); if (res.error) setError(res.error); else reload(); })}>질문 저장</Button>
                <TableContainer><Table size="small"><TableHead><TableRow><TableCell>종류</TableCell><TableCell>키</TableCell><TableCell>라벨</TableCell><TableCell>도움말</TableCell><TableCell>활성</TableCell></TableRow></TableHead><TableBody>{displayedQuestions.map((q) => <TableRow key={`${q.review_type}-${q.question_key}`}><TableCell>{q.review_type}</TableCell><TableCell>{q.question_key}</TableCell><TableCell>{q.label}</TableCell><TableCell>{q.helper_text}</TableCell><TableCell>{q.is_active ? "Y" : "N"}</TableCell></TableRow>)}</TableBody></Table></TableContainer>
              </Stack>}
              {tab === 3 && <Stack spacing={2}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>오류 로그</Typography>
                <TableContainer><Table size="small"><TableHead><TableRow><TableCell>시간</TableCell><TableCell>소스</TableCell><TableCell>메시지</TableCell><TableCell>상태</TableCell><TableCell /></TableRow></TableHead><TableBody>{data.errorLogs.map((log) => <TableRow key={log.id}><TableCell>{log.created_at}</TableCell><TableCell>{log.source}</TableCell><TableCell>{log.message}</TableCell><TableCell>{log.resolved_at ? "해결" : "미해결"}</TableCell><TableCell><Button size="small" disabled={Boolean(log.resolved_at) || isPending} onClick={() => startTransition(async () => { const res = await resolveErrorLog(log.id); if (res.error) setError(res.error); else reload(); })}>해결</Button></TableCell></TableRow>)}</TableBody></Table></TableContainer>
              </Stack>}
              {tab === 4 && <Stack spacing={2}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>CSV / Excel 다운로드</Typography>
                <Typography color="text.secondary">사용자, 챌린지, 등록 리추얼, 기록 수를 통합한 운영용 내보내기입니다.</Typography>
                <Stack direction="row" spacing={2}><Button variant="contained" onClick={() => downloadCsv(data.exportRows)}>CSV 다운로드</Button><Button variant="outlined" onClick={() => downloadExcel(data.exportRows)}>Excel 다운로드</Button></Stack>
              </Stack>}
            </CardContent>
          </Card>
        </Stack>
      </Container>
      </Box>
    </ThemeProvider>
  );
}
