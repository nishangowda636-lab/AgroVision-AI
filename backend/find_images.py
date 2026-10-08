import urllib.request
import urllib.parse
import json
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

def check_url(url):
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=5) as resp:
            return resp.status, resp.headers.get('content-type', '')
    except Exception as e:
        return 0, str(e)

# Test IFFCO URLs
test_urls = [
    "https://www.iffcobazar.in/en/product/nano-urea-liquid",
    "https://www.iffcobazar.in/en/product/nano-dap-liquid",
    "https://www.iffcobazar.in/en/product/iffco-water-soluble-fertilizer-npk-19-19-19",
    "https://www.sonalika.com/media/product-thumbnail/di-35-16744550-1682754259.webp",
    "https://www.mahindratractor.com/sites/default/files/2023-08/275-DI-TU-XP-Plus.png",
    "https://www.mahindratractor.com/sites/default/files/2023-08/575-DI-SP-PLUS.png",
    "https://aspee.com/attachments/products/aspee-electro-battery-sprayer-ael001-8ahbr-ael001-12ahbr--ln-190-190.png",
    "https://www.tataagrico.com/wp-content/uploads/2024/12/IMG-_1057.jpg",
    "https://kisankraftwebsite.s3.ap-south-1.amazonaws.com/upload/products//KK_WPP_10_cff57c8847.jpg",
    "https://kisankraftwebsite.s3.ap-south-1.amazonaws.com/upload/products//thumbnail_KK_WPP_21_27fcab8e14.jpg",
    "https://kisankraftwebsite.s3.ap-south-1.amazonaws.com/upload/products//KK_FMC_500_WITH_3hp_Motor_64d427d8fa.jpg",
    "https://aspee.com/attachments/products/aspee-bolo-motorized-knapsack-mist-blower-cum-duster-mb2--lc-190-190.png"
]

for u in test_urls:
    status, ctype = check_url(u)
    print(f"[{status}] {ctype[:25]} - {u[:65]}")
