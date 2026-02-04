#!/bin/bash
# 셀링폼 v3.8 로컬 서버 실행 스크립트
# Python이 작동하지 않을 경우 대비하여 Ruby를 사용합니다.

echo "🚀 셀링폼 v3.8 로컬 서버를 시작합니다..."
echo "🔗 접속 주소: http://localhost:8000"
echo "🛑 중단하려면 Ctrl+C를 누르세요."

ruby -run -ehttpd . -p8000
