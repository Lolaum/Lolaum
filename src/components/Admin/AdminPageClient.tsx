"use client";

import { useState, useTransition } from "react";
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
  deleteRegisteredRoutine,
  getAdminDashboardData,
  resolveErrorLog,
  setUserDeactivated,
  upsertChallengePeriod,
  upsertReviewQuestion,
  type AdminDashboardData,
  type AdminExportRow,
} from "@/api/admin";

type Initial = Awaited<ReturnType<typeof getAdminDashboardData>>;
type ExportKind = "donation" | "midReview" | "finalReview";

const exportKindLabels: Record<ExportKind, string> = {
  donation: "기부금",
  midReview: "중간회고",
  finalReview: "최종회고",
};

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
    questionKey: "good_pattern_title",
    displayName: "중간회고 1단계 · 잘 작동한 날 질문",
    description:
      "리추얼이 잘 된 날의 조건을 고르기 전에 보여주는 제목 질문입니다.",
    label: `리추얼이 가장 잘 작동했던 날,
어떤 조건이 갖춰져 있었나요?`,
    helperText: "2~3가지를 선택해주세요",
    isActive: true,
  },
  {
    reviewType: "mid" as const,
    questionKey: "hard_pattern_title",
    displayName: "중간회고 2단계 · 힘들었던 날 질문",
    description:
      "리추얼이 힘들었던 날의 걸림돌을 고르기 전에 보여주는 제목 질문입니다.",
    label: `리추얼이 가장 힘들었던 날,
무엇이 걸림돌이 됐나요?`,
    helperText: "1~2가지를 선택해주세요",
    isActive: true,
  },
  {
    reviewType: "mid" as const,
    questionKey: "condition_time",
    displayName: "중간회고 조건 상세 · 시간대",
    description: "시간대 조건을 선택했을 때 뜨는 상세 입력 질문입니다.",
    label: "어떤 시간대였나요?",
    helperText: "구체적으로 적어주세요",
    isActive: true,
  },
  {
    reviewType: "mid" as const,
    questionKey: "condition_place",
    displayName: "중간회고 조건 상세 · 장소",
    description: "장소 조건을 선택했을 때 뜨는 상세 입력 질문입니다.",
    label: "어떤 장소였나요?",
    helperText: "구체적으로 적어주세요",
    isActive: true,
  },
  {
    reviewType: "mid" as const,
    questionKey: "condition_habit",
    displayName: "중간회고 조건 상세 · 습관",
    description: "습관 조건을 선택했을 때 뜨는 상세 입력 질문입니다.",
    label: "어떤 습관이 도움이 됐나요?",
    helperText: "구체적으로 적어주세요",
    isActive: true,
  },
  {
    reviewType: "mid" as const,
    questionKey: "condition_body",
    displayName: "중간회고 조건 상세 · 컨디션",
    description: "컨디션 조건을 선택했을 때 뜨는 상세 입력 질문입니다.",
    label: "컨디션이 어땠나요?",
    helperText: "구체적으로 적어주세요",
    isActive: true,
  },
  {
    reviewType: "mid" as const,
    questionKey: "condition_emotion",
    displayName: "중간회고 조건 상세 · 감정",
    description: "감정 조건을 선택했을 때 뜨는 상세 입력 질문입니다.",
    label: "어떤 감정 상태였나요?",
    helperText: "구체적으로 적어주세요",
    isActive: true,
  },
  {
    reviewType: "mid" as const,
    questionKey: "condition_previous_action",
    displayName: "중간회고 조건 상세 · 전날 행동",
    description: "전날 행동 조건을 선택했을 때 뜨는 상세 입력 질문입니다.",
    label: "전날 어떤 행동이 영향을 줬나요?",
    helperText: "구체적으로 적어주세요",
    isActive: true,
  },
  {
    reviewType: "mid" as const,
    questionKey: "why_started",
    displayName: "중간회고 3단계 · 시작 이유",
    description:
      "참여자가 처음 리추얼을 시작한 이유를 적는 긴 답변 질문입니다.",
    label: "나는 왜 이 리추얼을 시작했나요?",
    helperText: "처음 다짐했던 이유를 떠올려보세요",
    isActive: true,
  },
  {
    reviewType: "mid" as const,
    questionKey: "keep_doing",
    displayName: "중간회고 3단계 · 유지할 것",
    description:
      "남은 기간 계속 유지할 행동 1가지를 적는 짧은 답변 질문입니다.",
    label: "남은 기간 동안 유지할 것 1가지",
    helperText: "예: 기상 직후 물 한 잔",
    isActive: true,
  },
  {
    reviewType: "mid" as const,
    questionKey: "will_change",
    displayName: "중간회고 3단계 · 바꿀 것",
    description: "남은 기간 바꿔볼 행동 1가지를 적는 짧은 답변 질문입니다.",
    label: "남은 기간 동안 바꿀 것 1가지",
    helperText: "예: 스트레칭 5분 → 10분으로 늘리기",
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
    isActive: true,
  },
  {
    reviewType: "final" as const,
    questionKey: "continuation_choice",
    displayName: "최종회고 3단계 · 유지/조정 선택",
    description:
      "유지하고 싶은지, 조정이 필요한지 선택하기 전 보여주는 질문입니다.",
    label: `이 리추얼을 지금 방식 그대로
1달 더 한다면?`,
    helperText: "",
    isActive: true,
  },
  {
    reviewType: "final" as const,
    questionKey: "adjustment_note",
    displayName: "최종회고 3단계 · 조정 내용",
    description: "‘조정이 필요하다’를 선택했을 때 추가로 보여주는 질문입니다.",
    label: "무엇을 바꾸면 나아질까요?",
    helperText: "조정하고 싶은 점을 적어주세요",
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
    isActive: true,
  },
];

type ReviewQuestionDraft = (typeof defaultQuestions)[number];
type EditableReviewQuestion = {
  reviewType: "mid" | "final";
  questionKey: string;
  label: string;
  helperText: string;
  isActive: boolean;
};

function questionDisplayName(reviewType: "mid" | "final", questionKey: string) {
  return (
    defaultQuestions.find(
      (question) =>
        question.reviewType === reviewType &&
        question.questionKey === questionKey,
    )?.displayName ?? questionKey
  );
}

function questionDescription(reviewType: "mid" | "final", questionKey: string) {
  return (
    defaultQuestions.find(
      (question) =>
        question.reviewType === reviewType &&
        question.questionKey === questionKey,
    )?.description ?? "관리자가 추가한 질문입니다."
  );
}

function getExportHeaders(rows: AdminExportRow[]) {
  return rows[0] ? Object.keys(rows[0]) : [];
}

function toCsv(rows: AdminExportRow[]) {
  const headers = getExportHeaders(rows);
  const escape = (value: unknown) =>
    `"${String(value ?? "").replaceAll('"', '""')}"`;
  return [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((key) => escape(row[key as keyof AdminExportRow])).join(","),
    ),
  ].join("\n");
}

function downloadFile(filename: string, body: BlobPart, type: string) {
  const blob = new Blob([body], { type });
  downloadBlob(filename, blob);
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function exportFilename(
  kind: ExportKind,
  periodLabel: string,
  extension: "csv" | "xlsx",
) {
  const safePeriod = periodLabel
    .replace(/[^\p{L}\p{N}._-]+/gu, "-")
    .replace(/^-|-$/g, "");
  return `lolaum-${exportKindLabels[kind]}-${safePeriod || "period"}.${extension}`;
}

function downloadCsv(
  rows: AdminExportRow[],
  kind: ExportKind,
  periodLabel: string,
) {
  downloadFile(
    exportFilename(kind, periodLabel, "csv"),
    `\uFEFF${toCsv(rows)}`,
    "text/csv;charset=utf-8",
  );
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeUint16(output: number[], value: number) {
  output.push(value & 0xff, (value >>> 8) & 0xff);
}

function writeUint32(output: number[], value: number) {
  output.push(
    value & 0xff,
    (value >>> 8) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 24) & 0xff,
  );
}

function createZip(entries: { name: string; content: string }[]) {
  const encoder = new TextEncoder();
  const fileParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const contentBytes = encoder.encode(entry.content);
    const crc = crc32(contentBytes);
    const localHeader: number[] = [];

    writeUint32(localHeader, 0x04034b50);
    writeUint16(localHeader, 20);
    writeUint16(localHeader, 0);
    writeUint16(localHeader, 0);
    writeUint16(localHeader, 0);
    writeUint16(localHeader, 0);
    writeUint32(localHeader, crc);
    writeUint32(localHeader, contentBytes.length);
    writeUint32(localHeader, contentBytes.length);
    writeUint16(localHeader, nameBytes.length);
    writeUint16(localHeader, 0);

    const local = new Uint8Array(
      localHeader.length + nameBytes.length + contentBytes.length,
    );
    local.set(localHeader, 0);
    local.set(nameBytes, localHeader.length);
    local.set(contentBytes, localHeader.length + nameBytes.length);
    fileParts.push(local);

    const centralHeader: number[] = [];
    writeUint32(centralHeader, 0x02014b50);
    writeUint16(centralHeader, 20);
    writeUint16(centralHeader, 20);
    writeUint16(centralHeader, 0);
    writeUint16(centralHeader, 0);
    writeUint16(centralHeader, 0);
    writeUint16(centralHeader, 0);
    writeUint32(centralHeader, crc);
    writeUint32(centralHeader, contentBytes.length);
    writeUint32(centralHeader, contentBytes.length);
    writeUint16(centralHeader, nameBytes.length);
    writeUint16(centralHeader, 0);
    writeUint16(centralHeader, 0);
    writeUint16(centralHeader, 0);
    writeUint16(centralHeader, 0);
    writeUint32(centralHeader, 0);
    writeUint32(centralHeader, offset);

    const central = new Uint8Array(centralHeader.length + nameBytes.length);
    central.set(centralHeader, 0);
    central.set(nameBytes, centralHeader.length);
    centralParts.push(central);

    offset += local.length;
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const endHeader: number[] = [];
  writeUint32(endHeader, 0x06054b50);
  writeUint16(endHeader, 0);
  writeUint16(endHeader, 0);
  writeUint16(endHeader, entries.length);
  writeUint16(endHeader, entries.length);
  writeUint32(endHeader, centralSize);
  writeUint32(endHeader, offset);
  writeUint16(endHeader, 0);

  const toBlobPart = (bytes: Uint8Array): ArrayBuffer =>
    bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    ) as ArrayBuffer;

  return new Blob(
    [...fileParts, ...centralParts, new Uint8Array(endHeader)].map(toBlobPart),
    {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
  );
}

function columnName(index: number) {
  let name = "";
  let value = index + 1;
  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
}

function createXlsxBlob(rows: AdminExportRow[]) {
  const headers = getExportHeaders(rows);
  const sheetRows = [
    headers,
    ...rows.map((row) => headers.map((header) => row[header])),
  ];
  const sheetData = sheetRows
    .map((row, rowIndex) => {
      const cells = row
        .map((value, columnIndex) => {
          const ref = `${columnName(columnIndex)}${rowIndex + 1}`;
          return `<c r="${ref}" t="inlineStr"><is><t>${escapeHtml(value)}</t></is></c>`;
        })
        .join("");
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join("");
  const worksheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetData}</sheetData></worksheet>`;
  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Export" sheetId="1" r:id="rId1"/></sheets></workbook>`;
  const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`;
  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`;

  return createZip([
    { name: "[Content_Types].xml", content: contentTypes },
    { name: "_rels/.rels", content: rootRels },
    { name: "xl/workbook.xml", content: workbook },
    { name: "xl/_rels/workbook.xml.rels", content: workbookRels },
    { name: "xl/worksheets/sheet1.xml", content: worksheet },
  ]);
}

function downloadExcel(
  rows: AdminExportRow[],
  kind: ExportKind,
  periodLabel: string,
) {
  downloadBlob(exportFilename(kind, periodLabel, "xlsx"), createXlsxBlob(rows));
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
      const result =
        mode === "login"
          ? await adminLogin({ email, password })
          : await adminSignup({ username, email, password, inviteCode });
      if ("error" in result && result.error) {
        setMessage(result.error);
        return;
      }
      setMessage(
        mode === "login"
          ? "관리자 로그인 완료"
          : "관리자 가입 완료. 로그인해주세요.",
      );
      if (mode === "login") onReload();
    });
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Card sx={{ borderRadius: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack spacing={1} sx={{ alignItems: "center", mb: 3 }}>
            <Box
              component="img"
              src="/images/common/LolaumLogoWeb.png"
              alt="Lolaum"
              sx={{ width: 180, maxWidth: "70%" }}
            />
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Admin
            </Typography>
            <Typography color="text.secondary">
              관리자 이메일 허용 목록과 초대 코드로 보호됩니다.
            </Typography>
          </Stack>
          <Tabs
            value={mode}
            onChange={(_, value) => setMode(value)}
            sx={{ mb: 3 }}
          >
            <Tab value="login" label="로그인" />
            <Tab value="signup" label="관리자 가입" />
          </Tabs>
          <Stack spacing={2}>
            {mode === "signup" && (
              <TextField
                label="닉네임"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            )}
            <TextField
              label="이메일"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              label="비밀번호"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {mode === "signup" && (
              <TextField
                label="관리자 가입 코드"
                type="password"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
              />
            )}
            {message && (
              <Alert severity={message.includes("완료") ? "success" : "error"}>
                {message}
              </Alert>
            )}
            <Button
              disabled={isPending}
              size="large"
              variant="contained"
              onClick={submit}
            >
              {isPending
                ? "처리 중..."
                : mode === "login"
                  ? "관리자 로그인"
                  : "관리자 가입"}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}

export default function AdminPageClient({ initial }: { initial: Initial }) {
  const initialExportPeriodId =
    initial.data?.periods.find((item) => item.is_active)?.id ??
    initial.data?.periods[0]?.id ??
    "";
  const [data, setData] = useState<AdminDashboardData | undefined>(
    initial.data,
  );
  const [error, setError] = useState(initial.error ?? "");
  const [tab, setTab] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [period, setPeriod] = useState({
    label: "",
    startDate: "",
    endDate: "",
    isActive: true,
  });
  const [reasonByUser, setReasonByUser] = useState<Record<string, string>>({});
  const [question, setQuestion] = useState<EditableReviewQuestion>(
    defaultQuestions[0],
  );
  const [exportPeriodId, setExportPeriodId] = useState(initialExportPeriodId);
  const [exportKind, setExportKind] = useState<ExportKind>("donation");

  const reload = () =>
    startTransition(async () => {
      const next = await getAdminDashboardData();
      setData(next.data);
      setError(next.error ?? "");
    });

  if (!data)
    return (
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
        is_active: q.isActive,
        label: q.label,
        updated_at: "기본값",
        display_name: q.displayName,
        description: q.description,
      }));

  const questionOptions = defaultQuestions.filter(
    (option) => option.reviewType === question.reviewType,
  );
  const selectedExportPeriod = data.periods.find(
    (item) => item.id === exportPeriodId,
  );
  const activePeriod = data.periods.find((item) => item.is_active);
  const activeRoutineRows = activePeriod
    ? data.users
        .map((user) => ({
          user,
          routines: user.routines.filter(
            (routine) => routine.periodId === activePeriod.id,
          ),
        }))
        .filter((row) => row.routines.length > 0)
    : [];
  const selectedExportPeriodLabel = selectedExportPeriod
    ? selectedExportPeriod.label ||
      `${selectedExportPeriod.start_date} ~ ${selectedExportPeriod.end_date}`
    : "기간 미선택";
  const exportSourceRows: Record<ExportKind, AdminExportRow[]> = {
    donation: data.donationExportRows,
    midReview: data.midReviewExportRows,
    finalReview: data.finalReviewExportRows,
  };
  const selectedExportRows = exportSourceRows[exportKind].filter(
    (row) => row.periodId === exportPeriodId,
  );
  const labelFor = (
    reviewType: "mid" | "final",
    questionKey: string,
    fallback: string,
  ) =>
    (
      displayedQuestions.find(
        (item) =>
          item.review_type === reviewType && item.question_key === questionKey,
      )?.label ?? fallback
    )
      .replace(/\s+/g, " ")
      .trim();
  const selectedDownloadRows: AdminExportRow[] =
    exportKind === "donation"
      ? selectedExportRows.map((row) => ({
          닉네임: row.name,
          기부금: row.penaltyAmount,
        }))
      : exportKind === "midReview"
        ? selectedExportRows.map((row) => ({
            닉네임: row.name,
            [labelFor(
              "mid",
              "good_pattern_title",
              "리추얼이 가장 잘 작동했던 날, 어떤 조건이 갖춰져 있었나요?",
            )]: row.goodConditions,
            "잘 작동했던 날의 조건별 상세 답변": row.goodConditionDetails,
            [labelFor(
              "mid",
              "hard_pattern_title",
              "리추얼이 가장 힘들었던 날, 무엇이 걸림돌이 됐나요?",
            )]: row.hardConditions,
            "힘들었던 날의 조건별 상세 답변": row.hardConditionDetails,
            [labelFor("mid", "why_started", "나는 왜 이 리추얼을 시작했나요?")]:
              row.whyStarted,
            [labelFor("mid", "keep_doing", "남은 기간 동안 유지할 것 1가지")]:
              row.keepDoing,
            [labelFor("mid", "will_change", "남은 기간 동안 바꿀 것 1가지")]:
              row.willChange,
          }))
        : selectedExportRows.map((row) => ({
            닉네임: row.name,
            [labelFor(
              "final",
              "results",
              "이번 달 하루 10분-30분 리추얼을 통해 만들어낸 눈에 보이는 결과물/행동 수치를 적어주세요.",
            )]: row.results,
            [labelFor(
              "final",
              "life_changes",
              "리추얼을 통해 실제 삶에서 바뀐 점이 있다면?",
            )]: row.lifeChanges,
            [labelFor(
              "final",
              "continuation_choice",
              "이 리추얼을 지금 방식 그대로 1달 더 한다면?",
            )]: row.continuationChoice,
            [labelFor("final", "adjustment_note", "무엇을 바꾸면 나아질까요?")]:
              row.adjustmentNote,
            [labelFor(
              "final",
              "feedback",
              "리추얼챌린지는 여러분의 의견을 받으며 쑥쑥 자랍니다",
            )]: row.feedback,
          }));

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
      isActive: saved?.is_active ?? draft.isActive,
    });
  };

  const handleDeleteRoutine = (registrationId: string, routineLabel: string) => {
    const confirmed = window.confirm(
      `${routineLabel} 신청을 삭제할까요? 연결된 리추얼 선언도 함께 삭제됩니다.`,
    );
    if (!confirmed) return;

    startTransition(async () => {
      const res = await deleteRegisteredRoutine({ registrationId });
      if (res.error) setError(res.error);
      else reload();
    });
  };

  return (
    <ThemeProvider theme={adminTheme}>
      <CssBaseline />
      <Box sx={{ minHeight: "100vh", bgcolor: "#f7f4ec", py: 4 }}>
        <Container maxWidth="xl">
          <Stack spacing={3}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ alignItems: { xs: "flex-start", sm: "center" } }}
            >
              <Box
                component="img"
                src="/images/common/LolaumLogoWeb.png"
                alt="Lolaum"
                sx={{ width: 160 }}
              />
              <Box>
                <Typography variant="h6" color="text.secondary">
                  롤라움 운영 페이지
                </Typography>
              </Box>
            </Stack>
            {error && <Alert severity="error">{error}</Alert>}
            {data.unsupportedTables.length > 0 && (
              <Alert severity="warning">
                Supabase에 선택 admin 테이블이 아직 없습니다:{" "}
                {data.unsupportedTables.join(", ")}. UI는 표시되지만 해당 기능
                저장은 테이블 생성 후 활성화됩니다.
              </Alert>
            )}
            <Card>
              <Tabs
                value={tab}
                onChange={(_, value) => setTab(value)}
                variant="scrollable"
              >
                <Tab label="리추얼 기간" />
                <Tab label="비활성 사용자" />
                <Tab label="활성 리추얼" />
                <Tab label="회고 질문" />
                <Tab label="오류 로그" />
                <Tab label="다운로드" />
              </Tabs>
              <Divider />
              <CardContent>
                {tab === 0 && (
                  <Stack spacing={2}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      리추얼 기간 관리
                    </Typography>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          md: "repeat(4, 1fr)",
                        },
                        gap: 2,
                      }}
                    >
                      <Box>
                        <TextField
                          fullWidth
                          label="라벨"
                          value={period.label}
                          onChange={(e) =>
                            setPeriod({ ...period, label: e.target.value })
                          }
                        />
                      </Box>
                      <Box>
                        <TextField
                          fullWidth
                          type="date"
                          label="시작일"
                          slotProps={{ inputLabel: { shrink: true } }}
                          value={period.startDate}
                          onChange={(e) =>
                            setPeriod({ ...period, startDate: e.target.value })
                          }
                        />
                      </Box>
                      <Box>
                        <TextField
                          fullWidth
                          type="date"
                          label="종료일"
                          slotProps={{ inputLabel: { shrink: true } }}
                          value={period.endDate}
                          onChange={(e) =>
                            setPeriod({ ...period, endDate: e.target.value })
                          }
                        />
                      </Box>
                      <Box>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={period.isActive}
                              onChange={(e) =>
                                setPeriod({
                                  ...period,
                                  isActive: e.target.checked,
                                })
                              }
                            />
                          }
                          label="활성화"
                        />
                      </Box>
                    </Box>
                    <Button
                      variant="contained"
                      disabled={isPending}
                      onClick={() =>
                        startTransition(async () => {
                          const res = await upsertChallengePeriod(period);
                          if (res.error) setError(res.error);
                          else reload();
                        })
                      }
                    >
                      기간 저장
                    </Button>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>라벨</TableCell>
                            <TableCell>시작</TableCell>
                            <TableCell>종료</TableCell>
                            <TableCell>상태</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {data.periods.map((p) => (
                            <TableRow key={p.id}>
                              <TableCell>{p.label ?? "-"}</TableCell>
                              <TableCell>{p.start_date}</TableCell>
                              <TableCell>{p.end_date}</TableCell>
                              <TableCell>
                                <Chip
                                  label={p.is_active ? "active" : "inactive"}
                                  color={p.is_active ? "success" : "default"}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Stack>
                )}
                {tab === 1 && (
                  <Stack spacing={2}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      사용자 비활성화 · 리추얼 추가 차단
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>사용자</TableCell>
                            <TableCell>이메일</TableCell>
                            <TableCell>신청 수</TableCell>
                            <TableCell>상태</TableCell>
                            <TableCell>사유</TableCell>
                            <TableCell>액션</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {data.users.map((u) => (
                            <TableRow key={u.id}>
                              <TableCell>
                                {u.name} ({u.username})
                              </TableCell>
                              <TableCell>{u.email}</TableCell>
                              <TableCell>{u.routineCount}</TableCell>
                              <TableCell>
                                <Chip
                                  label={u.deactivated ? "차단" : "정상"}
                                  color={u.deactivated ? "error" : "success"}
                                />
                              </TableCell>
                              <TableCell>
                                <TextField
                                  size="small"
                                  value={
                                    reasonByUser[u.id] ??
                                    u.deactivated?.reason ??
                                    ""
                                  }
                                  onChange={(e) =>
                                    setReasonByUser({
                                      ...reasonByUser,
                                      [u.id]: e.target.value,
                                    })
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="small"
                                  disabled={isPending}
                                  onClick={() =>
                                    startTransition(async () => {
                                      const res = await setUserDeactivated({
                                        userId: u.id,
                                        reason: reasonByUser[u.id] ?? "",
                                        deactivated: !u.deactivated,
                                      });
                                      if (res.error) setError(res.error);
                                      else reload();
                                    })
                                  }
                                >
                                  {u.deactivated ? "해제" : "차단"}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Stack>
                )}
                {tab === 2 && (
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        활성 기간 신청 리추얼
                      </Typography>
                      <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                        {activePeriod
                          ? `${activePeriod.label || `${activePeriod.start_date} ~ ${activePeriod.end_date}`} 기간에 신청된 리추얼만 표시합니다.`
                          : "현재 active 상태인 리추얼 기간이 없습니다."}
                      </Typography>
                    </Box>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>사용자</TableCell>
                            <TableCell>이메일</TableCell>
                            <TableCell>신청 리추얼</TableCell>
                            <TableCell>기간</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {activeRoutineRows.map(({ user, routines }) => (
                            <TableRow key={user.id}>
                              <TableCell>
                                {user.name} ({user.username})
                              </TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>
                                <Box
                                  sx={{
                                    display: "grid",
                                    gridAutoFlow: "column",
                                    gridTemplateRows: "repeat(2, auto)",
                                    gap: 1,
                                    justifyContent: "flex-start",
                                  }}
                                >
                                  {routines.map((routine) => (
                                    <Chip
                                      key={routine.id}
                                      label={routine.routineLabel}
                                      onDelete={() =>
                                        handleDeleteRoutine(
                                          routine.id,
                                          routine.routineLabel,
                                        )
                                      }
                                      disabled={isPending}
                                      color="primary"
                                      variant="outlined"
                                    />
                                  ))}
                                </Box>
                              </TableCell>
                              <TableCell>{routines[0]?.periodLabel ?? "-"}</TableCell>
                            </TableRow>
                          ))}
                          {activeRoutineRows.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={4}>
                                <Typography color="text.secondary">
                                  표시할 신청 리추얼이 없습니다.
                                </Typography>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Stack>
                )}
                {tab === 3 && (
                  <Stack spacing={3}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        중간/최종 회고 질문 수정
                      </Typography>
                      <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                        실제 앱에 보이는 질문 문구와 입력칸 안내문을 수정합니다.
                        개발용 키는 자동으로 관리됩니다.
                      </Typography>
                    </Box>

                    <Alert severity="info">
                      먼저 “중간회고/최종회고”와 “수정할 질문 위치”를 고르면
                      현재 저장된 문구가 아래 입력칸에 채워집니다.
                    </Alert>

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", md: "1fr 2fr" },
                        gap: 2,
                      }}
                    >
                      <TextField
                        select
                        fullWidth
                        label="회고 종류"
                        value={question.reviewType}
                        onChange={(e) => {
                          const reviewType = e.target.value as "mid" | "final";
                          const first = defaultQuestions.find(
                            (item) => item.reviewType === reviewType,
                          );
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
                        helperText={questionDescription(
                          question.reviewType,
                          question.questionKey,
                        )}
                        onChange={(e) => {
                          const next = questionOptions.find(
                            (item) => item.questionKey === e.target.value,
                          );
                          if (next) loadQuestion(next);
                        }}
                      >
                        {questionOptions.map((option) => (
                          <MenuItem
                            key={option.questionKey}
                            value={option.questionKey}
                          >
                            {option.displayName}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Box>

                    <Card variant="outlined" sx={{ bgcolor: "#fffaf0" }}>
                      <CardContent>
                        <Stack spacing={2}>
                          <Box>
                            <Typography
                              variant="subtitle2"
                              color="text.secondary"
                            >
                              현재 수정 중
                            </Typography>
                            <Typography sx={{ fontWeight: 800 }}>
                              {questionDisplayName(
                                question.reviewType,
                                question.questionKey,
                              )}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {questionDescription(
                                question.reviewType,
                                question.questionKey,
                              )}
                            </Typography>
                          </Box>
                          <TextField
                            fullWidth
                            multiline
                            minRows={2}
                            label="앱에 표시될 질문 문구"
                            value={question.label}
                            onChange={(e) =>
                              setQuestion({
                                ...question,
                                label: e.target.value,
                              })
                            }
                            helperText="줄바꿈도 그대로 반영됩니다. 사용자가 실제로 읽는 질문입니다."
                          />
                          <TextField
                            fullWidth
                            multiline
                            minRows={2}
                            label="입력칸 안내문 / 예시 문구"
                            value={question.helperText}
                            onChange={(e) =>
                              setQuestion({
                                ...question,
                                helperText: e.target.value,
                              })
                            }
                            helperText="답변칸 placeholder 또는 질문 아래 설명으로 표시됩니다. 필요 없으면 비워도 됩니다."
                          />
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={2}
                            sx={{ alignItems: { sm: "center" } }}
                          >
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={question.isActive}
                                  onChange={(e) =>
                                    setQuestion({
                                      ...question,
                                      isActive: e.target.checked,
                                    })
                                  }
                                />
                              }
                              label="사용 중"
                            />
                            <Button
                              variant="contained"
                              disabled={isPending || !question.label.trim()}
                              onClick={() =>
                                startTransition(async () => {
                                  const res =
                                    await upsertReviewQuestion(question);
                                  if (res.error) setError(res.error);
                                  else reload();
                                })
                              }
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
                            <TableRow
                              key={`${q.review_type}-${q.question_key}`}
                              hover
                            >
                              <TableCell>
                                {q.review_type === "mid" ? "중간" : "최종"}
                              </TableCell>
                              <TableCell>
                                <Typography sx={{ fontWeight: 700 }}>
                                  {q.display_name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {q.description}
                                </Typography>
                              </TableCell>
                              <TableCell
                                sx={{ whiteSpace: "pre-line", minWidth: 240 }}
                              >
                                {q.label}
                              </TableCell>
                              <TableCell
                                sx={{ whiteSpace: "pre-line", minWidth: 220 }}
                              >
                                {q.helper_text || "-"}
                              </TableCell>
                              <TableCell>
                                {q.is_active ? "사용 중" : "숨김"}
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="small"
                                  onClick={() =>
                                    setQuestion({
                                      reviewType: q.review_type,
                                      questionKey: q.question_key,
                                      label: q.label,
                                      helperText: q.helper_text ?? "",
                                      isActive: q.is_active,
                                    })
                                  }
                                >
                                  수정
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Stack>
                )}
                {tab === 4 && (
                  <Stack spacing={2}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      오류 로그
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>시간</TableCell>
                            <TableCell>소스</TableCell>
                            <TableCell>메시지</TableCell>
                            <TableCell>상태</TableCell>
                            <TableCell />
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {data.errorLogs.map((log) => (
                            <TableRow key={log.id}>
                              <TableCell>{log.created_at}</TableCell>
                              <TableCell>{log.source}</TableCell>
                              <TableCell>{log.message}</TableCell>
                              <TableCell>
                                {log.resolved_at ? "해결" : "미해결"}
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="small"
                                  disabled={
                                    Boolean(log.resolved_at) || isPending
                                  }
                                  onClick={() =>
                                    startTransition(async () => {
                                      const res = await resolveErrorLog(log.id);
                                      if (res.error) setError(res.error);
                                      else reload();
                                    })
                                  }
                                >
                                  해결
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Stack>
                )}
                {tab === 5 && (
                  <Stack spacing={3}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      데이터 다운로드
                    </Typography>
                    <Typography color="text.secondary">
                      리추얼 기간과 다운로드 종류를 선택하면 해당 기간 데이터만
                      내보냅니다.
                    </Typography>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                      <TextField
                        select
                        fullWidth
                        label="리추얼 기간"
                        value={exportPeriodId}
                        onChange={(e) => setExportPeriodId(e.target.value)}
                      >
                        {data.periods.map((item) => (
                          <MenuItem key={item.id} value={item.id}>
                            {item.label ||
                              `${item.start_date} ~ ${item.end_date}`}
                            {item.is_active ? " · 활성" : ""}
                          </MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        select
                        fullWidth
                        label="다운로드 종류"
                        value={exportKind}
                        onChange={(e) =>
                          setExportKind(e.target.value as ExportKind)
                        }
                      >
                        <MenuItem value="donation">기부금</MenuItem>
                        <MenuItem value="midReview">중간회고</MenuItem>
                        <MenuItem value="finalReview">최종회고</MenuItem>
                      </TextField>
                    </Stack>
                    <Alert
                      severity={selectedExportRows.length ? "info" : "warning"}
                    >
                      {selectedExportPeriodLabel} ·{" "}
                      {exportKindLabels[exportKind]}{" "}
                      {selectedExportRows.length.toLocaleString()}건
                    </Alert>
                    <Stack direction="row" spacing={2}>
                      <Button
                        variant="contained"
                        sx={{
                          bgcolor: "#eab32e",
                          boxShadow: "none",
                          color: "#fff",
                          "&:hover": { bgcolor: "#c99315", boxShadow: "none" },
                        }}
                        disabled={!selectedExportRows.length}
                        onClick={() =>
                          downloadExcel(
                            selectedDownloadRows,
                            exportKind,
                            selectedExportPeriodLabel,
                          )
                        }
                      >
                        Excel 다운로드
                      </Button>
                      <Button
                        variant="outlined"
                        disabled={!selectedExportRows.length}
                        onClick={() =>
                          downloadCsv(
                            selectedDownloadRows,
                            exportKind,
                            selectedExportPeriodLabel,
                          )
                        }
                      >
                        CSV 다운로드
                      </Button>
                    </Stack>
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
