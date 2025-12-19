'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Settings,
  Database,
  Bell,
  Palette,
  Shield,
  Download,
  Upload,
  CheckCircle,
} from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">설정</h1>
        <p className="text-gray-600 mt-1">시스템 설정을 관리합니다</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 일반 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              일반 설정
            </CardTitle>
            <CardDescription>기본 시스템 설정을 관리합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">회사명</Label>
              <Input
                id="companyName"
                defaultValue="EG 동안"
                placeholder="회사명을 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">시간대</Label>
              <Input
                id="timezone"
                defaultValue="Asia/Seoul (UTC+9)"
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">언어</Label>
              <Input
                id="language"
                defaultValue="한국어"
                disabled
              />
            </div>
          </CardContent>
        </Card>

        {/* 알림 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              알림 설정
            </CardTitle>
            <CardDescription>알림 수신 방법을 설정합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">일정 알림</p>
                <p className="text-sm text-gray-500">촬영/업로드 마감 알림</p>
              </div>
              <Badge variant="outline">준비 중</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">이메일 알림</p>
                <p className="text-sm text-gray-500">중요 이벤트 이메일 수신</p>
              </div>
              <Badge variant="outline">준비 중</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">슬랙 연동</p>
                <p className="text-sm text-gray-500">Slack 채널로 알림 전송</p>
              </div>
              <Badge variant="outline">준비 중</Badge>
            </div>
          </CardContent>
        </Card>

        {/* 테마 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              테마 설정
            </CardTitle>
            <CardDescription>화면 테마를 설정합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">다크 모드</p>
                <p className="text-sm text-gray-500">어두운 테마 사용</p>
              </div>
              <Badge variant="outline">준비 중</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">컬러 테마</p>
                <p className="text-sm text-gray-500">Purple (기본)</p>
              </div>
              <Badge className="bg-purple-100 text-purple-800">Purple</Badge>
            </div>
          </CardContent>
        </Card>

        {/* 데이터 관리 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              데이터 관리
            </CardTitle>
            <CardDescription>데이터 백업 및 복원을 관리합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">데이터 내보내기</p>
                <p className="text-sm text-gray-500">모든 데이터를 JSON으로 내보내기</p>
              </div>
              <Button variant="outline" size="sm" disabled>
                <Download className="h-4 w-4 mr-2" />
                내보내기
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">데이터 가져오기</p>
                <p className="text-sm text-gray-500">백업 파일에서 복원</p>
              </div>
              <Button variant="outline" size="sm" disabled>
                <Upload className="h-4 w-4 mr-2" />
                가져오기
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 보안 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              보안 설정
            </CardTitle>
            <CardDescription>계정 보안을 관리합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">2단계 인증</p>
                <p className="text-sm text-gray-500">추가 보안 인증 활성화</p>
              </div>
              <Badge variant="outline">준비 중</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">세션 관리</p>
                <p className="text-sm text-gray-500">활성 세션 확인</p>
              </div>
              <Badge variant="outline">준비 중</Badge>
            </div>
          </CardContent>
        </Card>

        {/* 시스템 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              시스템 정보
            </CardTitle>
            <CardDescription>현재 시스템 상태를 확인합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-gray-600">버전</p>
              <p className="font-mono">v0.1.0</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-gray-600">프레임워크</p>
              <p className="font-mono">Next.js 16.1.0</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-gray-600">데이터베이스</p>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <p className="font-mono">PostgreSQL (Supabase)</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-gray-600">마지막 업데이트</p>
              <p className="font-mono">{new Date().toLocaleDateString('ko-KR')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
