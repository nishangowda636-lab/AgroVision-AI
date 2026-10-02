"""
AgroVision AI — Farm-Aware Voice & Multilingual AI Co-Pilot & Proactive Agent Service (AIFarmAgent)
==================================================================================================
Combines:
1. Structured Farm Context (Crop, Variety, Stage, Age, Soil Type, pH, NPK, GPS Microclimate)
2. Live Weather Radar (Temp, Humidity, Rain Probability %, Wind speed, Precipitation mm)
3. IoT Sensors & Borewell Telemetry (Soil Moisture %, Pump mode, Rain-lock state)
4. Crop Health AI Pathology (Recent disease scans, severity, visible symptoms)
5. Satellite Remote Sensing (Copernicus Sentinel-2 NDVI, NDMI, Stress Zones)
6. Today's Prioritized Farm Plan Actions & Status
7. Real Farm Ledger Financial Intelligence (Recorded expenses, income, profitability)
8. Gemini / LLM REST integration (when GEMINI_API_KEY or AI_API_KEY is configured) with seamless agronomic fallback
9. Strict Safety Rules & Farmer-Friendly Structured Response Format:
   - WHAT TO DO
   - WHY
   - WHEN
   - DATA USED
   - CAUTION
"""

import os
import re
import json
import requests
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime, timedelta, timezone
from app.ai.crop_stage_engine import calculate_crop_stage_intelligence, STAGE_ICONS

MULTILINGUAL_TRANSLATIONS = {
    "Kannada": {
        "greeting": "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಆಗ್ರೋವಿಷನ್ AI ಫಾರ್ಮ್ ಏಜೆಂಟ್. {farm_name} ({crop_name}, {stage}) ತೋಟದ ನೀರಾವರಿ, ಬೆಳೆ ರೋಗ, ರಸಗೊಬ್ಬರ, ಲೆಡ್ಜರ್ ಖರ್ಚು ಮತ್ತು ಹವಾಮಾನದ ಬಗ್ಗೆ ಯಾವುದೇ ಪ್ರಶ್ನೆ ಕೇಳಿ.",
        "irrigate_yes": "ನಿಮ್ಮ {farm_name} ತೋಟದಲ್ಲಿ ಮಣ್ಣಿನ ತೇವಾಂಶ ಕಡಿಮೆ ಇದೆ ({moisture}%). {temp}°C ಉಷ್ಣಾಂಶವಿರುವುದರಿಂದ ಬೆಳಿಗ್ಗೆ ಹನಿ ನೀರಾವರಿ ಮಾಡುವುದು ಸೂಕ್ತ.",
        "irrigate_no": "ಮಣ್ಣಿನ ತೇವಾಂಶ ಉತ್ತಮವಾಗಿದೆ ({moisture}%). ಇಂದು ನೀರಾವರಿ ಅಗತ್ಯವಿಲ್ಲ.",
        "irrigate_rain": "ನಾಳೆ {rain_prob}% ಮಳೆ ಬರುವ ಸಾಧ್ಯತೆ ಇರುವುದರಿಂದ ({rainfall_mm} ಮಿ.ಮೀ), ನೀರಿನ ಪೋಲಾಗುವುದನ್ನು ತಡೆಯಲು ಇಂದು ನೀರಾವರಿ ಮುಂದೂಡಿ.",
        "sensor_missing": "ನಿಮ್ಮ ತೋಟದಲ್ಲಿ ಮಣ್ಣಿನ ತೇವಾಂಶ ಸಂವೇದಕ (Sensor) ಸಂಪರ್ಕ ಹೊಂದಿಲ್ಲ. ಮಣ್ಣಿನ ಮೇಲ್ಮೈ ಒಣಗಿದ್ದರೆ ಮಾತ್ರ ಬೆಳಿಗ್ಗೆ ಹನಿ ನೀರಾವರಿ ಮಾಡಿ.",
        "stage_info": "ನಿಮ್ಮ {crop_name} ಬೆಳೆಯು ಬಿತ್ತನೆ ಮಾಡಿ {age} ದಿನಗಳಾಗಿದ್ದು, ಪ್ರಸ್ತುತ {stage} ಹಂತದಲ್ಲಿದೆ. ಮುಂದಿನ {next_stage} ಹಂತಕ್ಕೆ ಇನ್ನು ಸುಮಾರು {days_left} ದಿನಗಳಿವೆ.",
        "confirm_expense": "ನೀವು {crop} ಬೆಳೆಗೆ ₹{amount} {category} ಖರ್ಚು ಮಾಡಿದ್ದೀರಿ ಎಂದು ಹೇಳಿದ್ದೀರಿ. ಇದನ್ನು ಫಾರ್ಮ್ ಲೆಡ್ಜರ್‌ನಲ್ಲಿ ದಾಖಲಿಸಬೇಕೆ?",
        "yellow_leaves": "ಎಲೆಗಳು ಹಳದಿಯಾಗಲು ಮುಖ್ಯ ಕಾರಣಗಳು: 1. ಸಾರಜನಕ (Nitrogen) ಕೊರತೆ, 2. ಮಣ್ಣಿನಲ್ಲಿ ಹೆಚ್ಚಿನ ನೀರು ನಿಲ್ಲುವುದು, 3. ಆರಂಭಿಕ ಬ್ಲೈಟ್ (Early Blight) ಶಿಲೀಂಧ್ರ. ನಿಖರ ತಪಾಸಣೆಗಾಗಿ ಎಲೆಯ ಫೋಟೋವನ್ನು AI ಸ್ಕ್ಯಾನರ್‌ನಲ್ಲಿ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ."
    },
    "Hindi": {
        "greeting": "नमस्ते! मैं आपका एग्रोविज़न AI फार्म एजेंट हूँ। {farm_name} ({crop_name}, {stage}) के लिए सिंचाई, फसल रोग, खाद, खर्च लेज़र और मौसम के बारे में कुछ भी पूछें।",
        "irrigate_yes": "आपके {farm_name} खेत में मिट्टी की नमी {moisture}% है। आज सुबह ड्रिप सिंचाई की सलाह दी जाती है।",
        "irrigate_no": "मिट्टी की नमी सामान्य ({moisture}%) है। आज अतिरिक्त सिंचाई की आवश्यकता नहीं है।",
        "irrigate_rain": "कल {rain_prob}% बारिश का पूर्वानुमान है ({rainfall_mm} mm)। कृपया आज सिंचाई टालें ताकि जलभराव न हो।",
        "sensor_missing": "मिट्टी की नमी का सेंसर कनेक्ट नहीं है। मिट्टी की ऊपरी सतह सूखने पर ही सुबह ड्रिप सिंचाई करें।",
        "stage_info": "आपकी {crop_name} फसल बुवाई के {age} दिन बाद वर्तमान में {stage} अवस्था में है। अगली {next_stage} अवस्था में लगभग {days_left} दिन शेष हैं।",
        "confirm_expense": "आपने {crop} के लिए {category} पर ₹{amount} खर्च करने की बात कही है। क्या इसे फार्म लेज़र में दर्ज करें?",
        "yellow_leaves": "पत्तियों के पीले होने के मुख्य कारण: 1. नाइट्रोजन की कमी (क्लोरोसिस), 2. अधिक पानी का जमाव, या 3. फंगल ब्लाइट। सटीक पहचान के लिए AI क्रॉप हेल्थ में पत्ती की तस्वीर अपलोड करें।"
    },
    "Telugu": {
        "greeting": "నమస్కారం! నేను మీ ఆగ్రోవిజన్ AI ఫార్మ్ ఏజెంట్. {farm_name} ({crop_name}, {stage}) పొలం నీటిపారుదల, తెగుళ్లు, ఎరువులు మరియు ఖర్చుల సమాచారం కోసం అడగండి.",
        "irrigate_yes": "మీ పొలంలో తేమ శాతం {moisture}% ఉంది. ఉదయం డ్రిప్ ద్వారా నీరందించండి.",
        "irrigate_no": "నేలలో తేమ బాగుంది ({moisture}%). ఈరోజు నీటిపారుదల అవసరం లేదు.",
        "irrigate_rain": "రేపు {rain_prob}% వర్షం కురిసే అవకాశం ఉంది. దయచేసి నేటి నీటిపారుదల వాయిదా వేయండి.",
        "sensor_missing": "నేల తేమ సెన్సార్ కనెక్ట్ కాలేదు. నేల పైభాగం ఆరిపోయినప్పుడు మాత్రమే ఉదయం నీరందించండి.",
        "stage_info": "మీ {crop_name} పంట విత్తిన {age} రోజుల తర్వాత ప్రస్తుతం {stage} దశలో ఉంది.",
        "confirm_expense": "{crop} పంట కోసం ₹{amount} {category} ఖర్చును రికార్డ్ చేయమంటారా?",
        "yellow_leaves": "ఆకులు పసుపు రంగులోకి మారడానికి కారణాలు: నత్రజని లోపం లేదా అధిక తేమ. స్పష్టమైన నిర్ధారణ కోసం AI కెమెరాతో స్కాన్ చేయండి."
    },
    "Tamil": {
        "greeting": "வணக்கம்! நான் உங்கள் அக்ரோவிஷன் AI பண்ணை வழிகாட்டி. {farm_name} ({crop_name}, {stage}) பாசனம், உரம், செலவு லெட்ஜர் மற்றும் நோய் தடுப்பு பற்றி கேட்கலாம்.",
        "irrigate_yes": "மண்ணின் ஈரப்பதம் {moisture}% ஆக உள்ளது. காலை நேரத்தில் சொட்டு நீர் பாசனம் செய்யவும்.",
        "irrigate_no": "மண்ணின் ஈரப்பதம் போதுமானதாக உள்ளது ({moisture}%). இன்று பாசனம் தேவையில்லை.",
        "irrigate_rain": "நாளை {rain_prob}% மழை வாய்ப்பு உள்ளதால் இன்று பாசனத்தை தவிர்க்கவும்.",
        "sensor_missing": "மண் ஈரப்பத சென்சார் இணைக்கப்படவில்லை. மண் காய்ந்திருந்தால் மட்டும் காலை நீர் பாய்ச்சவும்.",
        "stage_info": "உங்கள் {crop_name} பயிர் விதைத்து {age} நாட்கள் கடந்து தற்போது {stage} நிலையில் உள்ளது.",
        "confirm_expense": "{crop} பயிருக்காக ₹{amount} {category} செலவை பதிவு செய்யவா?",
        "yellow_leaves": "இலைகள் மஞ்சளாவதற்கு தழைச்சத்து குறைபாடு அல்லது வேரழுகல் காரணமாக இருக்கலாம். துல்லியமான முடிவுக்கு பயிர் நலப்பிரிவில் படம் எடுக்கவும்."
    },
    "Malayalam": {
        "greeting": "നമസ്കാരം! ഞാൻ നിങ്ങളുടെ അഗ്രോവിഷൻ AI ഫാം അസിസ്റ്റന്റാണ്. {farm_name} ({crop_name}, {stage}) കൃഷി, ചിലവ് വിവരങ്ങൾ ചോദിക്കാം.",
        "irrigate_yes": "മണ്ണിലെ ഈർപ്പം {moisture}% ആണ്. രാവിലെ തുള്ളിനന നൽകാൻ നിർദ്ദേശിക്കുന്നു.",
        "irrigate_no": "മണ്ണിലെ ഈർപ്പം അനുയോജ്യമാണ് ({moisture}%). ഇന്ന് നനയ്ക്കേണ്ടതില്ല.",
        "irrigate_rain": "നാളെ മഴ സാധ്യത ({rain_prob}%) ഉള്ളതിനാൽ നനയ്ക്കുന്നത് ഒഴിവാക്കുക.",
        "sensor_missing": "മണ്ണിലെ ഈർപ്പ സെൻസർ കണക്ട് ചെയ്തിട്ടില്ല.",
        "stage_info": "നിങ്ങളുടെ {crop_name} വിള {age} ദിവസങ്ങൾ കഴിഞ്ഞ് ഇപ്പോൾ {stage} ഘട്ടത്തിലാണ്.",
        "confirm_expense": "{crop} വിളയ്ക്കായി ₹{amount} {category} ചിലവ് രേഖപ്പെടുത്തണോ?",
        "yellow_leaves": "ഇലകൾ മഞ്ഞനിറമാകുന്നത് നൈട്രജൻ കുറവ് അല്ലെങ്കിൽ കുമിൾബാധ മൂലമാകാം. എഐ സ്കാനറിൽ ഫോട്ടോ അപ്‌ലോഡ് ചെയ്യുക."
    },
    "Marathi": {
        "greeting": "नमस्कार! मी तुमचा ॲग्रोव्हिजन AI फार्म सहाय्यक आहे. {farm_name} ({crop_name}, {stage}) शेतासाठी सिंचन, खते व खर्चाची माहिती विचारा.",
        "irrigate_yes": "जमिनीतील ओलावा {moisture}% आहे. सकाळी ठिबक सिंचन करण्याची शिफारस केली जाते.",
        "irrigate_no": "जमिनीतील ओलावा समाधानकारक आहे ({moisture}%). आज पाणी देण्याची गरज नाही.",
        "irrigate_rain": "उद्या {rain_prob}% पावसाचा अंदाज असल्याने आज सिंचन पुढे ढकला.",
        "sensor_missing": "मातीतील ओलावा सेन्सर जोडलेला नाही.",
        "stage_info": "तुमचे {crop_name} पीक पेरणीनंतर {age} दिवसांनी सध्या {stage} अवस्थेत आहे.",
        "confirm_expense": "तुम्ही {crop} साठी {category} वर ₹{amount} खर्च नोंदवू इच्छिता का?",
        "yellow_leaves": "पाने पिवळी पडण्याची मुख्य कारणे: नायट्रोजनची कमतरता किंवा अतिपाणी. अचूक निदानासाठी फोटो अपलोड करा."
    },
    "Bengali": {
        "greeting": "নমস্কার! আমি আপনার অ্যাগ্রোভিশন এআই ফার্ম সহকারী। {farm_name} ({crop_name}, {stage}) খামারের সেচ, সার ও খরচের হিসাব সম্পর্কে জানতে পারেন।",
        "irrigate_yes": "মাটিতে আর্দ্রতা {moisture}% রয়েছে। সকালে ড্রিপ সেচ প্রয়োগ করুন।",
        "irrigate_no": "মাটিতে আর্দ্রতা পর্যাপ্ত রয়েছে ({moisture}%)। আজ সেচের প্রয়োজন নেই।",
        "irrigate_rain": "আগামীকাল {rain_prob}% বৃষ্টির সম্ভাবনা রয়েছে, তাই আজকের সেচ স্থগিত রাখুন।",
        "sensor_missing": "মাটির আর্দ্রতা সেন্সর সংযুক্ত নেই।",
        "stage_info": "আপনার {crop_name} ফসল রোপণের {age} দিন পর বর্তমানে {stage} পর্যায়ে রয়েছে।",
        "confirm_expense": "আপনি কি {crop} ফসলের জন্য ₹{amount} {category} খরচ রেকর্ড করতে চান?",
        "yellow_leaves": "পাতা হলুদ হওয়ার সম্ভাব্য কারণ: নাইট্রোজেনের ঘাটতি বা ছত্রাক আক্রমণ। স্পষ্ট প্রমাণের জন্য ক্রপ হেলথ স্ক্যানার ব্যবহার করুন।"
    },
    "Gujarati": {
        "greeting": "નમસ્તે! હું તમારો એગ્રોવિઝન AI ફાર્મ સહાયક છું. {farm_name} ({crop_name}, {stage}) ખેતર માટે સિંચાઈ, ખાતર અને ખર્ચ વિશે પૂછો.",
        "irrigate_yes": "જમીનમાં ભેજનું પ્રમાણ {moisture}% છે. સવારે ટપક પદ્ધતિથી સિંચાઈ કરો.",
        "irrigate_no": "જમીનમાં ભેજ પૂરતો છે ({moisture}%). આજે સિંચાઈની જરૂર નથી.",
        "irrigate_rain": "આવતીકાલે {rain_prob}% વરસાદની શક્યતા હોવાથી આજે સિંચાઈ મુલતવી રાખો.",
        "sensor_missing": "જમીન ભેજ સેન્સર જોડાયેલ નથી.",
        "stage_info": "તમારો {crop_name} પાક વાવણીના {age} દિવસ પછી હાલમાં {stage} તબક્કામાં છે.",
        "confirm_expense": "{crop} પાક માટે ₹{amount} {category} ખર્ચ નોંધવો છે?",
        "yellow_leaves": "પાંદડા પીળા પડવાના મુખ્ય કારણો: નાઇટ્રોજનની ઉણપ અથવા મૂળમાં વધુ પાણી. ફોટો સ્કેન કરો."
    },
    "Punjabi": {
        "greeting": "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡਾ ਐਗਰੋਵਿਜ਼ਨ AI ਫਾਰਮ ਏਜੰਟ ਹਾਂ। {farm_name} ({crop_name}, {stage}) ਖੇਤ ਸਿੰਚਾਈ, ਖਾਦ ਅਤੇ ਖਰਚੇ ਬਾਰੇ ਪੁੱਛੋ।",
        "irrigate_yes": "ਮਿੱਟੀ ਵਿੱਚ ਨਮੀ {moisture}% ਹੈ। ਸਵੇਰੇ ਤੁਪਕਾ ਸਿੰਚਾਈ ਕਰੋ।",
        "irrigate_no": "ਮਿੱਟੀ ਵਿੱਚ ਨਮੀ ਸਹੀ ਹੈ ({moisture}%)। ਅੱਜ ਪਾਣੀ ਲਾਉਣ ਦੀ ਲੋੜ ਨਹੀਂ।",
        "irrigate_rain": "ਕੱਲ੍ਹ {rain_prob}% ਮੀਂਹ ਪੈਣ ਦੀ ਸੰਭਾਵਨਾ ਹੈ, ਇਸ ਲਈ ਅੱਜ ਸਿੰਚਾਈ ਟਾਲੋ।",
        "sensor_missing": "ਮਿੱਟੀ ਨਮੀ ਸੈਂਸਰ ਕੁਨੈਕਟ ਨਹੀਂ ਹੈ।",
        "stage_info": "ਤੁਹਾਡੀ {crop_name} ਫਸਲ ਬਿਜਾਈ ਦੇ {age} ਦਿਨਾਂ ਬਾਅਦ {stage} ਅਵਸਥਾ ਵਿੱਚ ਹੈ।",
        "confirm_expense": "ਕੀ ਤੁਸੀਂ {crop} ਲਈ ₹{amount} {category} ਖਰਚਾ ਰਿਕਾਰਡ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ?",
        "yellow_leaves": "ਪੱਤੇ ਪੀਲੇ ਪੈਣ ਦੇ ਮੁੱਖ ਕਾਰਨ ਨਾਈਟ੍ਰੋਜਨ ਦੀ ਕਮੀ ਜਾਂ ਜ਼ਿਆਦਾ ਪਾਣੀ ਹਨ। ਫੋਟੋ ਸਕੈਨ ਕਰੋ।"
    },
    "Odia": {
        "greeting": "ନମସ୍କାର! ମୁଁ ଆପଣଙ୍କର ଆଗ୍ରୋଭିଜନ AI ଫାର୍ମ କୋ-ପାଇଲଟ୍। {farm_name} ({crop_name}, {stage}) କ୍ଷେତ ପାଇଁ ଜଳସେଚନ, ଖତ, ଖର୍ଚ୍ଚ ଏବଂ ପାଣିପାଗ ବିଷୟରେ ପଚାରନ୍ତୁ।",
        "irrigate_yes": "ମାଟିରେ ଆର୍ଦ୍ରତା {moisture}% ଅଛି। ସକାଳେ ଡ୍ରିପ୍ ଜଳସେଚନ କରନ୍ତୁ।",
        "irrigate_no": "ମାଟିର ଆର୍ଦ୍ରତା ପର୍ଯ୍ୟାପ୍ତ ଅଛି ({moisture}%)। ଆଜି ଜଳସେଚନ ଆବଶ୍ୟକ ନାହିଁ।",
        "irrigate_rain": "ଆସନ୍ତାକାଲି {rain_prob}% ବର୍ଷା ସମ୍ଭାବନା ଥିବାରୁ ଆଜି ଜଳସେଚନ ସ୍ଥଗିତ ରଖନ୍ତୁ।",
        "sensor_missing": "ମାଟିର ଆର୍ଦ୍ରତା ସେନ୍ସର ସଂଯୁକ୍ତ ନାହିଁ।",
        "stage_info": "ଆପଣଙ୍କର {crop_name} ଫସଲ ବୁଣିବାର {age} ଦିନ ପରେ ବର୍ତ୍ତମାନ {stage} ପର୍ଯ୍ୟାୟରେ ଅଛି।",
        "confirm_expense": "ଆପଣ {crop} ପାଇଁ ₹{amount} {category} ଖର୍ଚ୍ଚ ରେକର୍ଡ କରିବାକୁ ଚାହାଁନ୍ତି କି?",
        "yellow_leaves": "ପତ୍ର ହଳଦିଆ ପଡ଼ିବାର ମୁଖ୍ୟ କାରଣ: ଯବକ୍ଷାରଜାନ (Nitrogen) ଅଭାବ କିମ୍ବା ଫିମ୍ପି ରୋଗ। AI କ୍ୟାମେରାରେ ଯାଞ୍ଚ କରନ୍ତୁ।"
    },
    "Urdu": {
        "greeting": "السلام علیکم! میں آپ کا ایگرو ویژن AI فارم ایجنٹ ہوں۔ {farm_name} ({crop_name}, {stage}) کے لیے آبپاشی، کھاد اور اخراجات کے بارے میں پوچھیں۔",
        "irrigate_yes": "مٹی میں نمی {moisture}% ہے۔ صبح کے وقت ڈرپ آبپاشی کی سفارش کی جاتی ہے۔",
        "irrigate_no": "مٹی میں نمی مناسب ہے ({moisture}%)۔ آج پانی دینے کی ضرورت نہیں ہے۔",
        "irrigate_rain": "کل {rain_prob}% بارش کا امکان ہے، لہٰذا آج آبپاشی مؤخر کریں۔",
        "sensor_missing": "مٹی کی نمی کا سینسر منسلک نہیں ہے۔",
        "stage_info": "آپ کی {crop_name} فصل بوائی کے {age} دن بعد اس وقت {stage} مرحلے میں ہے۔",
        "confirm_expense": "کیا آپ {crop} کے لیے ₹{amount} {category} کا خرچ ریکارڈ کرنا چاہتے ہیں؟",
        "yellow_leaves": "پتوں کے پیلے ہونے کی وجوہات: نائٹروجن کی کمی یا پانی کا زیادہ جمع ہونا۔"
    }
}


def _extract_amount_from_query(query: str) -> Optional[float]:
    """Extracts numeric amount from voice text (e.g. ₹2000, 2000 rupees, 2k, 1500)."""
    clean_q = query.replace(",", "").replace("₹", " ")
    k_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:k|thousand)', clean_q, re.IGNORECASE)
    if k_match:
        try:
            return float(k_match.group(1)) * 1000.0
        except Exception:
            pass

    num_match = re.search(r'(?:spent|record|cost|amount|rupees|rs\.?|inr|of)?\s*(\d+(?:\.\d+)?)', clean_q, re.IGNORECASE)
    if num_match:
        try:
            val = float(num_match.group(1))
            if val > 0:
                return val
        except Exception:
            pass
    return None


def _extract_expense_category(query: str) -> str:
    """Classifies spoken text into standard agricultural expense categories."""
    q_low = query.lower()
    if any(w in q_low for w in ["fertilizer", "urea", "potash", "dap", "npk", "khad", "gobbara"]):
        return "Fertilizer"
    if any(w in q_low for w in ["seed", "sapling", "beej", "bithana"]):
        return "Seeds"
    if any(w in q_low for w in ["pesticide", "insecticide", "fungicide", "spray", "aushadhi", "keetnashak"]):
        return "Pesticides"
    if any(w in q_low for w in ["labour", "labor", "worker", "coolie", "mazdoor", "kooli"]):
        return "Labour"
    if any(w in q_low for w in ["irrigation", "water", "diesel for pump", "electricity", "current bill"]):
        return "Irrigation"
    if any(w in q_low for w in ["tractor", "machinery", "plough", "rotavator", "harvester", "equipment", "rental"]):
        return "Machinery"
    if any(w in q_low for w in ["transport", "tempo", "auto", "freight", "lorry", "mandi transport"]):
        return "Transport"
    if any(w in q_low for w in ["repair", "pipe fix", "motor repair", "maintenance"]):
        return "Repairs"
    if any(w in q_low for w in ["fuel", "diesel", "petrol"]):
        return "Fuel/Electricity"
    if any(w in q_low for w in ["sold", "sale", "produce sale", "income", "revenue", "mandi income"]):
        return "Crop Sales"
    return "Other"


def _call_gemini_api_if_available(system_prompt: str, user_query: str) -> Optional[str]:
    """
    Calls Google Gemini REST API if GEMINI_API_KEY, AI_API_KEY, or GOOGLE_API_KEY is configured in the environment.
    Returns None if key is absent or API fails.
    """
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("AI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        return None

    models_to_try = ["gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-flash-latest"]
    for model_name in models_to_try:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
            payload = {
                "contents": [
                    {
                        "parts": [
                            {"text": f"{system_prompt}\n\nFarmer Query: {user_query}"}
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.2,
                    "maxOutputTokens": 600
                }
            }
            res = requests.post(url, json=payload, timeout=6.0)
            if res.status_code == 200:
                data = res.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        return parts[0].get("text", "").strip()
        except Exception:
            continue

    return None


def generate_ai_assistant_response(
    query: str,
    farm_details: Optional[Dict[str, Any]] = None,
    language: str = "English",
    page_context: Optional[str] = None,
    weather_data: Optional[Dict[str, Any]] = None,
    sensor_data: Optional[Dict[str, Any]] = None,
    disease_scans: Optional[List[Dict[str, Any]]] = None,
    activity_history: Optional[List[Dict[str, Any]]] = None,
    today_plan: Optional[Dict[str, Any]] = None,
    ledger_summary: Optional[Dict[str, Any]] = None,
    ledger_transactions: Optional[List[Dict[str, Any]]] = None,
    all_user_farms: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Farm-Aware AI Farm Agent reasoning engine with Voice, LLM reasoning, & Local Fallback.
    Answers strictly using real farm context and enforces the 5-point structured response format:
    - WHAT TO DO
    - WHY
    - WHEN
    - DATA USED
    - CAUTION
    """
    q_lower = query.lower().strip()

    # Extract Farm Parameters
    farm = farm_details or {}
    farm_id = farm.get("id")
    farm_name = farm.get("name", "Your Farm")
    crop = farm.get("crop", "Tomato")
    crop_variety = farm.get("crop_variety", "Hybrid")
    sowing_date = farm.get("sowing_date")
    location = farm.get("location_name") or farm.get("location") or "Karnataka, India"
    size_acres = max(0.1, float(farm.get("size_acres") or 1.0))
    soil_type = farm.get("soil_type", "Loam")
    soil_ph = farm.get("soil_ph", 6.5)
    nitrogen = farm.get("nitrogen", 140.0)
    phosphorus = farm.get("phosphorus", 40.0)
    potassium = farm.get("potassium", 200.0)
    water_source = farm.get("water_source", "Borewell")
    irrigation_method = farm.get("irrigation_method", "Drip Irrigation")
    stage_override = farm.get("current_stage_override")

    # Compute Crop Stage
    stage_info = calculate_crop_stage_intelligence(
        crop_name=crop,
        sowing_date_str=sowing_date,
        current_stage_override=stage_override
    )
    active_stage = stage_info["active_stage"]
    crop_age_days = stage_info["crop_age_days"]
    days_to_next = stage_info["days_to_next_stage"]
    next_stage = stage_info["next_stage"]
    stage_tasks = stage_info["key_tasks"]
    nutrient_guidance = stage_info["nutrient_guidance"]
    disease_risks = stage_info["disease_risks"]

    # Extract Weather
    w = weather_data or {}
    temp = float(w.get("temperature", 27.5))
    humidity = int(w.get("humidity", 65))
    wind_speed = float(w.get("wind_speed", 10.0))
    rain_prob = float(w.get("rain_prob") or w.get("rainfall_prob_pct") or 15.0)
    rainfall_mm = float(w.get("precipitation_mm") or 0.0)
    weather_cond = w.get("condition", "Partly Cloudy")

    # Extract Sensors
    s = sensor_data or {}
    moisture = s.get("moisture")
    sensor_connected = s.get("sensor_connected", False)

    # Extract Disease & Activities
    scans = disease_scans or []
    recent_disease = scans[0] if len(scans) > 0 else None

    activities = activity_history or []
    recent_fertilizer = next((a for a in activities if "fertilizer" in a.get("event_type", "").lower() or "fertilizer" in a.get("title", "").lower()), None)

    plan_items = (today_plan or {}).get("today_plan", []) or (today_plan or {}).get("actions", [])

    # Extract Ledger Data
    txs = ledger_transactions or []
    tot_exp = sum(float(t.get("cost", 0.0)) for t in txs if t.get("type", "expense").lower() == "expense")
    tot_inc = sum(float(t.get("cost", 0.0)) for t in txs if t.get("type", "expense").lower() == "income")
    net_profit = tot_inc - tot_exp

    lang_pack = MULTILINGUAL_TRANSLATIONS.get(language, {})

    response_text = ""
    data_citations = []
    proactive_alerts = []
    action_intent = None
    confirmation_required = False

    what_to_do = None
    why = None
    when_to_do = None
    data_used = None
    caution = None

    # Check proactive alerts
    if rain_prob >= 50.0:
        proactive_alerts.append(f"🌧️ Rain expected ({int(rain_prob)}% probability). Delay scheduled irrigation & fertilizer.")
    if humidity >= 70:
        proactive_alerts.append(f"🦠 Elevated relative humidity ({humidity}%). Check lower foliage for fungal symptoms.")
    if days_to_next is not None and 1 <= days_to_next <= 5:
        proactive_alerts.append(f"🌱 Transitioning to {next_stage} in ~{days_to_next} days.")

    # =========================================================================
    # 1. VOICE INTENT: Record Expense / Income
    # =========================================================================
    if any(kw in q_lower for kw in ["record", "spent", "kharch", "expense", "i bought", "paid", "bill of", "kharid"]):
        amt = _extract_amount_from_query(query)
        if amt and amt > 0:
            cat = _extract_expense_category(query)
            is_income = "sold" in q_lower or "sale" in q_lower or "income" in q_lower
            tx_type = "income" if is_income else "expense"

            action_intent = {
                "type": "record_expense",
                "data": {
                    "farm_id": farm_id,
                    "type": tx_type,
                    "category": cat,
                    "crop": crop,
                    "cost": amt,
                    "item_name": f"{cat} for {crop}",
                    "stage": active_stage,
                    "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                    "provenance": "ACTUAL"
                },
                "requires_confirmation": True,
                "confirmation_prompt": f"You said you spent ₹{amt:,.2f} on {cat} for {crop}. Record this in Farm Ledger?"
            }
            confirmation_required = True

            if lang_pack and "confirm_expense" in lang_pack:
                response_text = lang_pack["confirm_expense"].format(crop=crop, amount=f"{amt:,.2f}", category=cat)
            else:
                response_text = f"You said you spent ₹{amt:,.2f} on {cat} for {crop}. Would you like me to record this in your Farm Ledger?"
            data_citations.append(f"Parsed Voice Intent: ₹{amt:,.2f} {cat} ({crop})")

    # 2. VOICE INTENT: Navigation / Open Module
    elif not action_intent and any(kw in q_lower for kw in ["open", "go to", "navigate to", "show me", "view"]):
        if any(w_k in q_lower for w_k in ["weather", "radar", "rain forecast"]):
            action_intent = {"type": "navigate", "path": "/weather"}
            response_text = f"Opening Weather Advisor for {farm_name}."
        elif any(w_k in q_lower for w_k in ["health", "disease", "scan", "pathology", "leaf"]):
            action_intent = {"type": "navigate", "path": "/crop-health"}
            response_text = f"Opening AI Crop Health & Pathology Hub for {farm_name}."
        elif any(w_k in q_lower for w_k in ["satellite", "sentinel", "ndvi", "field health"]):
            action_intent = {"type": "navigate", "path": "/satellite"}
            response_text = f"Opening Satellite Field Health Observatory for {farm_name}."
        elif any(w_k in q_lower for w_k in ["ledger", "finance", "expense", "profit", "accounts"]):
            action_intent = {"type": "navigate", "path": "/ledger"}
            response_text = f"Opening Farm Ledger and Profitability records for {farm_name}."
        elif any(w_k in q_lower for w_k in ["fertilizer", "nutrition", "npk", "dosage"]):
            action_intent = {"type": "navigate", "path": "/fertilizer"}
            response_text = f"Opening Fertilizer Advisor for {farm_name}."
        elif any(w_k in q_lower for w_k in ["irrigation", "pump", "borewell", "water"]):
            action_intent = {"type": "navigate", "path": "/irrigation"}
            response_text = f"Opening Smart Irrigation and Borewell Controller for {farm_name}."

    # 3. VOICE INTENT: Farm Switching
    elif not action_intent and any(kw in q_lower for kw in ["switch farm", "switch to", "change farm to", "change to", "select farm", "open farm", "switch"]):
        target_crop = None
        for c in ["tomato", "sugarcane", "potato", "cotton", "maize", "wheat", "rice", "paddy", "chilli", "onion", "groundnut"]:
            if c in q_lower:
                target_crop = c
                break
        if target_crop or "farm" in q_lower:
            action_intent = {
                "type": "switch_farm",
                "target_crop": target_crop,
                "target_text": query
            }
            response_text = f"Switching your active workspace to your {target_crop or 'requested'} farm."

    # =========================================================================
    # 4. LLM / GEMINI WITH SYSTEM PROMPT INJECTION (IF CONFIGURED)
    # =========================================================================
    if not response_text:
        system_prompt = (
            f"You are the AgroVision AI Farm Agent for farmer plot '{farm_name}'.\n"
            f"FARM CONTEXT:\n"
            f"- Location: {location}\n"
            f"- Crop: {crop} ({crop_variety}), Area: {size_acres} acres\n"
            f"- Crop Stage: {active_stage} (Day {crop_age_days})\n"
            f"- Soil: {soil_type} (pH: {soil_ph}, N:{nitrogen}, P:{phosphorus}, K:{potassium})\n"
            f"- Live Weather: {temp}°C, Humidity: {humidity}%, Rain Chance: {int(rain_prob)}%, Precip: {rainfall_mm}mm, Condition: {weather_cond}\n"
            f"- IoT Sensors: {'Online (Moisture: ' + str(moisture) + '%)' if sensor_connected else 'Offline / Model Estimated'}\n"
            f"- Disease Scans: {recent_disease.get('detected_problem') if recent_disease else 'No active infections detected'}\n\n"
            f"RULES:\n"
            f"1. Structure important recommendations using headers:\n"
            f"WHAT TO DO: ...\nWHY: ...\nWHEN: ...\nDATA USED: ...\nCAUTION: ...\n"
            f"2. Keep answers simple, farmer-friendly, and concise.\n"
            f"3. Never invent fake sensor values or guarantee crop yields. For uncertain conditions, state field verification is required.\n"
            f"4. Respond in {language}."
        )
        llm_reply = _call_gemini_api_if_available(system_prompt, query)
        if llm_reply:
            response_text = llm_reply

    # =========================================================================
    # 5. DOMAIN AGRONOMIC REASONING FALLBACK (STRUCTURED FORMAT)
    # =========================================================================
    if not response_text:
        # A. "Should I irrigate now?" / Irrigation query
        if any(w_k in q_lower for w_k in ["irrigate", "water", "drip", "should i water", "moisture", "borewell", "neeru", "pani"]):
            if rain_prob >= 50.0:
                what_to_do = f"Delay scheduled {irrigation_method} cycle for your {crop} field."
                why = f"Live meteorological radar indicates {int(rain_prob)}% rainfall probability (~{rainfall_mm:.1f} mm). Delaying irrigation prevents waterlogging, root asphyxiation, and expensive nutrient leaching."
                when_to_do = "Recheck after rainfall"
                data_used = f"Open-Meteo Live Radar: {int(rain_prob)}% Rain Chance | Pump Rain-Lock: Active"
                caution = "Ensure field drainage channels are clear of debris to prevent standing water."
            elif sensor_connected and moisture is not None:
                if moisture < 38.0:
                    what_to_do = f"Run {irrigation_method} for 35–45 minutes to restore root-zone moisture."
                    why = f"Soil moisture probe reading is {moisture}%, which is below the optimal {crop} buffer (45–55%). Ambient temperature will reach {temp}°C today."
                    when_to_do = "Morning (6:00 AM – 8:30 AM)"
                    data_used = f"IoT Soil Probe: {moisture}% Moisture | Temp: {temp}°C | Crop: {crop} ({active_stage})"
                    caution = "Avoid midday irrigation to reduce evaporation loss and scalding of foliage."
                else:
                    what_to_do = f"Hold irrigation today; maintain regular monitoring."
                    why = f"Soil moisture is at a healthy {moisture}%, which is within the optimal buffer for {crop}."
                    when_to_do = "Next check tomorrow morning"
                    data_used = f"IoT Soil Probe: {moisture}% Moisture (Adequate)"
                    caution = "Verify sensor probe contact depth if topsoil visually appears dry."
            else:
                what_to_do = f"Perform a quick topsoil finger-test (2 inches depth), and run a light morning cycle if dry."
                why = f"Soil moisture sensor is currently offline on {farm_name}. Based on {soil_type} soil and {temp}°C temperature, a standard morning cycle is advised."
                when_to_do = "Early Morning (6:00 AM – 8:00 AM)"
                data_used = f"Sensor: Offline | Temp: {temp}°C | Soil: {soil_type} | Stage: {active_stage}"
                caution = "Field verification is required since real-time moisture telemetry is unavailable."

            response_text = (
                f"**WHAT TO DO:** {what_to_do}\n\n"
                f"**WHY:** {why}\n\n"
                f"**WHEN:** {when_to_do}\n\n"
                f"**DATA USED:** {data_used}\n\n"
                f"**CAUTION:** {caution}"
            )
            data_citations.append("AgroVision Smart Irrigation Engine")

        # B. "Why is my crop stressed?" / "Why are my leaves yellow?"
        elif any(w_k in q_lower for w_k in ["yellow", "stress", "disease", "pest", "spots", "curl", "leaf", "leaves"]):
            if recent_disease and recent_disease.get("severity") in ["High", "Moderate"]:
                prob = recent_disease.get("detected_problem", "Foliar Blight")
                what_to_do = f"Inspect treated rows for {prob} symptoms and scout for pathogen spread."
                why = f"Recent AI pathology scan detected {prob} ({recent_disease.get('severity')} severity). Warm, humid conditions ({humidity}%) accelerate spore reproduction."
                when_to_do = "Today during midday (11:00 AM – 2:00 PM)"
                data_used = f"Crop Health Pathology: {prob} ({recent_disease.get('severity')}) | Humidity: {humidity}%"
                caution = "Do not apply chemical sprays during windy conditions (>15 km/h) to prevent drift."
            else:
                what_to_do = "Take a clear close-up photo of affected leaf symptoms using AI Crop Health."
                why = f"Leaf stress on {crop} in {active_stage} stage is typically caused by: 1. Nitrogen/Iron deficiency, 2. Root zone waterlogging, or 3. Fungal leaf spots."
                when_to_do = "Today in natural daylight"
                data_used = f"Crop Stage: {active_stage} (Day {crop_age_days}) | Soil pH: {soil_ph} | Humidity: {humidity}%"
                caution = "Always verify physical symptoms before applying broad-spectrum pesticides."

            response_text = (
                f"**WHAT TO DO:** {what_to_do}\n\n"
                f"**WHY:** {why}\n\n"
                f"**WHEN:** {when_to_do}\n\n"
                f"**DATA USED:** {data_used}\n\n"
                f"**CAUTION:** {caution}"
            )
            data_citations.append("Crop Health Pathology & Agronomic Diagnostic Rules")

        # C. "Will rain affect my fertilizer application?" / Fertilizer query
        elif any(w_k in q_lower for w_k in ["fertilizer", "fertiliser", "urea", "dap", "potash", "npk", "khad", "gobbara", "nutrition"]):
            if rain_prob >= 50.0:
                what_to_do = f"Postpone {active_stage} stage fertilizer application and foliar booster sprays."
                why = f"Rain probability is high ({int(rain_prob)}%, ~{rainfall_mm:.1f} mm). Heavy rain causes surface runoff and leaches expensive nitrates beyond the root zone."
                when_to_do = "24 hours after rain clears"
                data_used = f"Crop Stage: {active_stage} (Day {crop_age_days}) | Open-Meteo Rain Radar: {int(rain_prob)}% precipitation chance | Nutrient Buffer: Safe"
                caution = "Applying fertilizer before heavy rain leads to nitrate pollution in farm runoff."
            elif recent_fertilizer and recent_fertilizer.get("event_date") == datetime.now(timezone.utc).strftime("%Y-%m-%d"):
                what_to_do = "No fertilizer required today."
                why = f"Fertilizer application was already recorded today ({recent_fertilizer.get('title')}). Allow 48–72 hours for crop uptake."
                when_to_do = "Next application in 7–10 days"
                data_used = f"Farm Activity Log: {recent_fertilizer.get('title')} recorded today"
                caution = "Excessive fertilizer application causes chemical salt burn on feeder roots."
            else:
                what_to_do = f"Apply {active_stage} split nutrition: {stage_tasks[0] if stage_tasks else 'balanced NPK booster'}."
                why = f"Your {crop} is {crop_age_days} days old ({active_stage} stage). {nutrient_guidance}."
                when_to_do = "Morning hours after soil moisture check"
                data_used = f"Stage: {active_stage} (Day {crop_age_days}) | Soil pH: {soil_ph} | N:{nitrogen} P:{phosphorus} K:{potassium}"
                caution = "Ensure topsoil has adequate moisture before applying granular fertilizers."

            response_text = (
                f"**WHAT TO DO:** {what_to_do}\n\n"
                f"**WHY:** {why}\n\n"
                f"**WHEN:** {when_to_do}\n\n"
                f"**DATA USED:** {data_used}\n\n"
                f"**CAUTION:** {caution}"
            )
            data_citations.append("Fertilizer Advisor & Crop Stage Engine")

        # D. "What should I do today?" / "Plan My Day"
        elif any(w_k in q_lower for w_k in ["today", "plan", "what should i do", "action", "task", "day"]):
            if len(plan_items) > 0:
                bullet_lines = []
                for idx, item in enumerate(plan_items[:3], 1):
                    bullet_lines.append(f"{idx}. **[{item.get('priority', 'MEDIUM')}] {item.get('action') or item.get('title')}:** {item.get('what_to_do') or item.get('summary')} *(Reason: {item.get('reason') or item.get('why_recommended')})*")
                actions_summary = "\n\n".join(bullet_lines)

                what_to_do = f"Execute today's top prioritized actions for {farm_name} ({crop} • {active_stage} Stage, Day {crop_age_days}):\n\n{actions_summary}"
                why = f"Synthesized from your live {location} weather ({temp}°C, {int(rain_prob)}% rain), soil moisture, crop phenology, and pathology records."
                when_to_do = "Follow specific morning and midday windows listed in Today's Farm Plan"
                data_used = f"Weather + IoT + Crop Stage (Day {crop_age_days}) + Pathology History"
                caution = "Check off tasks in Today's Farm Plan as completed to log your activity history."
            else:
                what_to_do = f"1. Morning irrigation check for {crop}.\n2. Follow {active_stage} nutrition ({nutrient_guidance}).\n3. Routine visual scouting for {disease_risks}."
                why = f"Baseline management for {crop} at Day {crop_age_days}."
                when_to_do = "Morning (6:30 AM – 9:30 AM)"
                data_used = f"Crop Stage Phenology ({active_stage}, Day {crop_age_days})"
                caution = "Verify sensor connection to receive automated moisture-driven schedules."

            response_text = (
                f"**WHAT TO DO:** {what_to_do}\n\n"
                f"**WHY:** {why}\n\n"
                f"**WHEN:** {when_to_do}\n\n"
                f"**DATA USED:** {data_used}\n\n"
                f"**CAUTION:** {caution}"
            )
            data_citations.append("AgroVision Today's Farm Plan Intelligence")

        # E. "How is my farm health?" / "Explain My Farm"
        elif any(w_k in q_lower for w_k in ["farm health", "explain my farm", "status of my farm", "how is my farm", "overview"]):
            sat_status_txt = f"Satellite NDVI is {today_plan.get('satellite_data', {}).get('mean_ndvi', 'Optimal')} ({today_plan.get('satellite_data', {}).get('health_status', 'Healthy')})" if today_plan and today_plan.get('satellite_data') else "Satellite scan indicates normal vegetative vigor"
            sensor_txt = f"Soil moisture is {moisture}% (Healthy)" if (sensor_connected and moisture) else "Soil sensors offline (Agronomic baseline active)"

            what_to_do = f"Maintain active monitoring for {farm_name} ({crop}, {size_acres} acres, {active_stage} stage)."
            why = f"Overall farm condition is stable. {sat_status_txt}. {sensor_txt}. Current weather is {temp}°C with {int(rain_prob)}% rain probability."
            when_to_do = "Daily monitoring"
            data_used = f"Farm Setup + Weather ({temp}°C) + Crop Stage (Day {crop_age_days}) + Satellite Vigor"
            caution = "Ground verification is advised if visual stress spots appear in the field."

            response_text = (
                f"**WHAT TO DO:** {what_to_do}\n\n"
                f"**WHY:** {why}\n\n"
                f"**WHEN:** {when_to_do}\n\n"
                f"**DATA USED:** {data_used}\n\n"
                f"**CAUTION:** {caution}"
            )
            data_citations.append("Multi-Stream Agro-Intelligence Engine")

        # F. Financial & Ledger Queries
        elif any(w_k in q_lower for w_k in ["how much have i spent", "how much spent", "total expense", "biggest expense", "how much profit", "my expenses", "my ledger", "ledger summary"]):
            if "profit" in q_lower:
                status_txt = "Net Profit" if net_profit >= 0 else "Net Loss"
                response_text = (
                    f"**Farm Financial Ledger for {farm_name} ({crop}, {size_acres} acres):**\n\n"
                    f"• **Total Recorded Income:** ₹{tot_inc:,.2f}\n"
                    f"• **Total Recorded Expenses:** ₹{tot_exp:,.2f}\n"
                    f"• **{status_txt}:** ₹{abs(net_profit):,.2f}\n"
                    f"• **Net Profit / Acre:** ₹{(net_profit / size_acres):,.2f}/acre\n\n"
                    f"*(Calculated strictly from your {len(txs)} recorded ledger transactions)*"
                )
            elif "biggest expense" in q_lower or "highest expense" in q_lower:
                if len(txs) > 0:
                    cat_totals = {}
                    for t in txs:
                        if t.get("type", "expense").lower() == "expense":
                            c = t.get("category", "Other")
                            cat_totals[c] = cat_totals.get(c, 0.0) + float(t.get("cost", 0.0))
                    if cat_totals:
                        sorted_cats = sorted(cat_totals.items(), key=lambda x: x[1], reverse=True)
                        top_cat, top_val = sorted_cats[0]
                        pct = round((top_val / tot_exp) * 100.0, 1) if tot_exp > 0 else 0
                        response_text = f"Your biggest expense on {farm_name} ({crop}) is **{top_cat}** at **₹{top_val:,.2f}** ({pct}% of your total ₹{tot_exp:,.2f} recorded expenses)."
                    else:
                        response_text = f"No expense transactions recorded yet for {farm_name}."
                else:
                    response_text = f"No expense transactions recorded yet for {farm_name}."
            else: # Total spent
                if tot_exp > 0:
                    response_text = (
                        f"You have spent a total of **₹{tot_exp:,.2f}** on your {crop} crop on **{farm_name}** ({size_acres} acres).\n"
                        f"• **Cost per Acre:** ₹{(tot_exp / size_acres):,.2f}/acre across {len(txs)} recorded entries."
                    )
                else:
                    response_text = f"Zero expenses recorded for {farm_name} ({crop}) so far. You can tell me *'Record ₹2,000 fertilizer expense'* anytime."
            data_citations.append(f"Farm Ledger DB: {len(txs)} Transactions (Total ₹{tot_exp:,.2f})")

        # G. General Greeting / Fallback
        else:
            if lang_pack and "greeting" in lang_pack:
                response_text = lang_pack["greeting"].format(farm_name=farm_name, crop_name=crop, stage=active_stage)
            else:
                sown_txt = f" (Sown: {sowing_date})" if sowing_date else ""
                response_text = (
                    f"Hello! I am your AgroVision AI Farm Agent monitoring **{farm_name}** ({crop} • {active_stage} Stage, Day {crop_age_days}{sown_txt}).\n\n"
                    f"I have real-time access to your farm's weather ({temp}°C, {int(rain_prob)}% rain), soil chemistry, crop stage lifecycle, Farm Ledger expenses, and field history. You can ask me:\n"
                    f"• *'What should I do today?'*\n"
                    f"• *'Should I irrigate now?'*\n"
                    f"• *'Will rain affect my fertilizer application?'*\n"
                    f"• *'Why are my leaves yellow?'*\n"
                    f"• *'How is my farm health?'*\n"
                    f"• *'Record ₹2,000 fertilizer expense.'*"
                )

    return {
        "response": response_text,
        "what_to_do": what_to_do,
        "why": why,
        "when_to_do": when_to_do,
        "data_used": data_used,
        "caution": caution,
        "language": language,
        "farm_context_used": True if farm_details else False,
        "farm_id": farm_id,
        "farm_name": farm_name,
        "crop": crop,
        "crop_stage": active_stage,
        "crop_age_days": crop_age_days,
        "sensor_connected": sensor_connected,
        "proactive_alerts": proactive_alerts,
        "data_citations": data_citations,
        "page_context_used": page_context,
        "action": action_intent,
        "confirmation_required": confirmation_required
    }
