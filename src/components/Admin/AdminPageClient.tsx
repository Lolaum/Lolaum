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
  {
    reviewType: "mid" as const,
    questionKey: "why_started",
    displayName: "중간회고 3단계 · 시작 이유",
    description: "참여자가 처음 리추얼을 시작한 이유를 적는 긴 답변 질문입니다.",
    label: "나는 왜 이 리추얼을 시작했나요?",
    helperText: "처음 다짐했던 이유를 떠올려보세요",
    sortOrder: 10,
    isActive: true,
  },
  {
    reviewType: "mid" as const,
    questionKey: "keep_doing",
    displayName: "중간회고 3단계 · 유지할 것",
    description: "남은 기간 계속 유지할 행동 1가지를 적는 짧은 답변 질문입니다.",
    label: "남은 기간 동안 유지할 것 1가지",
    helperText: "예: 기상 직후 물 한 잔",
    sortOrder: 20,
    isActive: true,
  },
  {
    reviewType: "mid" as const,
    questionKey: "will_change",
    displayName: "중간회고 3단계 · 바꿀 것",
    description: "남은 기간 바꿔볼 행동 1가지를 적는 짧은 답변 질문입니다.",
    label: "남은 기간 동안 바꿀 것 1가지",
    helperText: "예: 스트레칭 5분 → 10분으로 늘리기",
    sortOrder: 30,
    isActive: true,
  },
  {
    reviewType: "final" as const,
    questionKey: "results",
    displayName: "최종회고 1단계 · 결과물/행동 수치",
    description: "이번 리추얼로 남긴 결과물과 행동 수치를 적는 질문입니다.",
    label: `이번 달 하루 10분-30분 리추얼을 통해 만들어낸
눈에 보이는 결과물/행동 수치를 적어주세요.`,
    helperText: `- 이번 달 내가 남긴 것
ex) 책 ___권 / 기록 ___개 / 운동 ___회 / 공부 ___회 등`,
    sortOrder: 10,
    isActive: true,
  },
  {
    reviewType: "final" as const,
    questionKey: "life_changes",
    displayName: "최종회고 2단계 · 삶의 변화",
    description: "실제 삶에서 바뀐 점을 적는 질문입니다.",
    label: `리추얼을 통해 실제 삶에서
바뀐 점이 있다면?`,
    helperText: `ex) 실제 성과, 생산성, 감정, 에너지, 집중력 등

챌린지 첫 날 적었던 리추얼 선언을 읽어보고,
기대하는 변화에 가까워지기 위해 노력한 스스로를 칭찬해주세요!`,
    sortOrder: 20,
    isActive: true,
  },
  {
    reviewType: "final" as const,
    questionKey: "continuation_choice",
    displayName: "최종회고 3단계 · 유지/조정 선택",
    description: "유지하고 싶은지, 조정이 필요한지 선택하기 전 보여주는 질문입니다.",
    label: `이 리추얼을 지금 방식 그대로
1달 더 한다면?`,
    helperText: "",
    sortOrder: 30,
    isActive: true,
  },
  {
    reviewType: "final" as const,
    questionKey: "adjustment_note",
    displayName: "최종회고 3단계 · 조정 내용",
    description: "‘조정이 필요하다’를 선택했을 때 추가로 보여주는 질문입니다.",
    label: "무엇을 바꾸면 나아질까요?",
    helperText: "조정하고 싶은 점을 적어주세요",
    sortOrder: 40,
    isActive: true,
  },
  {
    reviewType: "final" as const,
    questionKey: "feedback",
    displayName: "최종회고 4단계 · 운영 피드백",
    description: "서비스/운영진에게 남기는 선택 질문입니다.",
    label: `리추얼챌린지는 여러분의 의견을 받으며
쑥쑥 자랍니다 💛`,
    helperText: "자유롭게 의견을 남겨주세요 (선택사항)",
    sortOrder: 50,
    isActive: true,
  },
];


type ReviewQuestionDraft = (typeof defaultQuestions)[number];
type EditableReviewQuestion = {
  reviewType: "mid" | "final";
  questionKey: string;
  label: string;
  helperText: string;
  sortOrder: number;
  isActive: boolean;
};

function questionDisplayName(reviewType: "mid" | "final", questionKey: string) {
  return (
    defaultQuestions.find(
      (question) =>
        question.reviewType === reviewType && question.questionKey === questionKey,
    )?.displayName ?? questionKey
  );
}

function questionDescription(reviewType: "mid" | "final", questionKey: string) {
  return (
    defaultQuestions.find(
      (question) =>
        question.reviewType === reviewType && question.questionKey === questionKey,
    )?.description ?? "관리자가 추가한 질문입니다."
  );
}

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
  const [question, setQuestion] = useState<EditableReviewQuestion>(defaultQuestions[0]);

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
    display_name: string;
    description: string;
  }> = data.reviewQuestions.length
    ? data.reviewQuestions.map((q) => ({
        ...q,
        display_name: questionDisplayName(q.review_type, q.question_key),
        description: questionDescription(q.review_type, q.question_key),
      }))
    : defaultQuestions.map((q) => ({
        id: q.questionKey,
        review_type: q.reviewType,
        question_key: q.questionKey,
        helper_text: q.helperText,
        sort_order: q.sortOrder,
        is_active: q.isActive,
        label: q.label,
        updated_at: "기본값",
        display_name: q.displayName,
        description: q.description,
      }));

  const questionOptions = defaultQuestions.filter(
    (option) => option.reviewType === question.reviewType,
  );

  const loadQuestion = (draft: ReviewQuestionDraft) => {
    const saved = displayedQuestions.find(
      (item) =>
        item.review_type === draft.reviewType &&
        item.question_key === draft.questionKey,
    );
    setQuestion({
      reviewType: draft.reviewType,
      questionKey: draft.questionKey,
      label: saved?.label ?? draft.label,
      helperText: saved?.helper_text ?? draft.helperText,
      sortOrder: saved?.sort_order ?? draft.sortOrder,
      isActive: saved?.is_active ?? draft.isActive,
    });
  };

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
              {tab === 2 && <Stack spacing={3}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>중간/최종 회고 질문 수정</Typography>
                  <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                    실제 앱에 보이는 질문 문구와 입력칸 안내문을 수정합니다. 개발용 키는 자동으로 관리됩니다.
                  </Typography>
                </Box>

                <Alert severity="info">
                  먼저 “중간회고/최종회고”와 “수정할 질문 위치”를 고르면 현재 저장된 문구가 아래 입력칸에 채워집니다.
                </Alert>

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 2fr" }, gap: 2 }}>
                  <TextField
                    select
                    fullWidth
                    label="회고 종류"
                    value={question.reviewType}
                    onChange={(e) => {
                      const reviewType = e.target.value as "mid" | "final";
                      const first = defaultQuestions.find((item) => item.reviewType === reviewType);
                      if (first) loadQuestion(first);
                    }}
                  >
                    <MenuItem value="mid">중간회고</MenuItem>
                    <MenuItem value="final">최종회고</MenuItem>
                  </TextField>
                  <TextField
                    select
                    fullWidth
                    label="수정할 질문 위치"
                    value={question.questionKey}
                    helperText={questionDescription(question.reviewType, question.questionKey)}
                    onChange={(e) => {
                      const next = questionOptions.find((item) => item.questionKey === e.target.value);
                      if (next) loadQuestion(next);
                    }}
                  >
                    {questionOptions.map((option) => (
                      <MenuItem key={option.questionKey} value={option.questionKey}>
                        {option.displayName}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>

                <Card variant="outlined" sx={{ bgcolor: "#fffaf0" }}>
                  <CardContent>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">현재 수정 중</Typography>
                        <Typography sx={{ fontWeight: 800 }}>
                          {questionDisplayName(question.reviewType, question.questionKey)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {questionDescription(question.reviewType, question.questionKey)}
                        </Typography>
                      </Box>
                      <TextField
                        fullWidth
                        multiline
                        minRows={2}
                        label="앱에 표시될 질문 문구"
                        value={question.label}
                        onChange={(e) => setQuestion({ ...question, label: e.target.value })}
                        helperText="줄바꿈도 그대로 반영됩니다. 사용자가 실제로 읽는 질문입니다."
                      />
                      <TextField
                        fullWidth
                        multiline
                        minRows={2}
                        label="입력칸 안내문 / 예시 문구"
                        value={question.helperText}
                        onChange={(e) => setQuestion({ ...question, helperText: e.target.value })}
                        helperText="답변칸 placeholder 또는 질문 아래 설명으로 표시됩니다. 필요 없으면 비워도 됩니다."
                      />
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ alignItems: { sm: "center" } }}>
                        <TextField
                          type="number"
                          label="표시 순서"
                          value={question.sortOrder}
                          onChange={(e) => setQuestion({ ...question, sortOrder: Number(e.target.value) })}
                          sx={{ maxWidth: 160 }}
                        />
                        <FormControlLabel
                          control={<Switch checked={question.isActive} onChange={(e) => setQuestion({ ...question, isActive: e.target.checked })} />}
                          label="사용 중"
                        />
                        <Button
                          variant="contained"
                          disabled={isPending || !question.label.trim()}
                          onClick={() => startTransition(async () => {
                            const res = await upsertReviewQuestion(question);
                            if (res.error) setError(res.error);
                            else reload();
                          })}
                        >
                          이 질문 저장
                        </Button>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>

                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>회고</TableCell>
                        <TableCell>질문 위치</TableCell>
                        <TableCell>현재 질문 문구</TableCell>
                        <TableCell>입력 안내</TableCell>
                        <TableCell>상태</TableCell>
                        <TableCell />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {displayedQuestions.map((q) => (
                        <TableRow key={`${q.review_type}-${q.question_key}`} hover>
                          <TableCell>{q.review_type === "mid" ? "중간" : "최종"}</TableCell>
                          <TableCell>
                            <Typography sx={{ fontWeight: 700 }}>{q.display_name}</Typography>
                            <Typography variant="caption" color="text.secondary">{q.description}</Typography>
                          </TableCell>
                          <TableCell sx={{ whiteSpace: "pre-line", minWidth: 240 }}>{q.label}</TableCell>
                          <TableCell sx={{ whiteSpace: "pre-line", minWidth: 220 }}>{q.helper_text || "-"}</TableCell>
                          <TableCell>{q.is_active ? "사용 중" : "숨김"}</TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              onClick={() => setQuestion({
                                reviewType: q.review_type,
                                questionKey: q.question_key,
                                label: q.label,
                                helperText: q.helper_text ?? "",
                                sortOrder: q.sort_order,
                                isActive: q.is_active,
                              })}
                            >
                              수정
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
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
