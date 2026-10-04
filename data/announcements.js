/*
 * Announcement data for the Jin Air TAG announcement player.
 * Edit announcement wording, titles, English references, or input definitions here.
 * Keep placeholder names in braces (for example {flightNumber}, {destination}, {gate}).
 * UI labels are English; announcement templates preserve their operational language.
 * English references are written as natural airport PA scripts rather than literal translations.
 */
window.LJ_ANNOUNCEMENT_DATA = {
  "appVersion": "20261004.15",
  "branch": "TAG Branch",
  "flights": [
    "LJ044",
    "LJ046"
  ],
  "codeshares": {
    "LJ044": {
      "carrierKo": "대한항공",
      "carrierEn": "Korean Air",
      "flight": "KE5768"
    }
  },
  "destinations": {
    "ICN": {
      "label": "ICN",
      "ko": "인천",
      "en": "Incheon"
    },
    "PUS": {
      "label": "PUS",
      "ko": "부산",
      "en": "Busan"
    }
  },
  "announcements": [
    {
      "id": "1",
      "icon": "🎫",
      "tone": "checkin",
      "title": "Final Call for Check-in (No names)",
      "summary": "Final check-in call",
      "language": "auto",
      "template": "진에어에서 수속 마감 예정 안내 말씀 드리겠습니다. 진에어 {destination}행 체크인 카운터가 이제 곧 마감될 예정입니다. 아직까지 수속하지 않으신 진에어 {destination}행 승객께서는 카운터에서 수속을 바로 마쳐주시기 바랍니다. 감사합니다.",
      "englishTemplate": "May I have your attention, please. This is the final check-in call for passengers travelling with Jin Air to {destination}. The Jin Air check-in counters will be closing shortly. Any passengers who have not yet checked in are requested to report to the Jin Air check-in counter immediately. Thank you."
    },
    {
      "id": "2",
      "icon": "📣",
      "tone": "checkin",
      "title": "Final Call for Check-in (With names)",
      "summary": "Final check-in call with names",
      "language": "auto",
      "template": "진에어에서 수속 마감 예정 안내 말씀 드리겠습니다. 진에어 {destination}행 체크인 카운터가 이제 곧 마감될 예정입니다. 아직까지 수속하지 않으신, {namesRepeated}, 승객께서는 진에어 카운터에서 수속을 바로 마쳐주시기 바랍니다. 감사합니다.",
      "inputs": [
        {
          "type": "textarea",
          "key": "names",
          "label": "Passenger name(s)",
          "placeholder": "e.g. KIM CHULSOO, LEE YOUNGHEE",
          "required": true,
          "translate": true
        },
        {
          "type": "repeat",
          "key": "nameRepeat",
          "label": "Name repeats",
          "default": 2,
          "min": 1,
          "max": 9
        }
      ],
      "derived": [
        {
          "key": "namesRepeated",
          "template": "{names}",
          "repeatKey": "nameRepeat",
          "separator": ", "
        }
      ],
      "englishTemplate": "May I have your attention, please. Jin Air is making a final check-in call for {names}, travelling to {destination}. Please report to the Jin Air check-in counter immediately to complete check-in. The counter will be closing shortly. Once again, {names}, please report to the Jin Air check-in counter. Thank you."
    },
    {
      "id": "3",
      "icon": "🧳",
      "tone": "baggage",
      "title": "Baggage Inspection Call",
      "summary": "Baggage inspection call",
      "language": "auto",
      "template": "진에어에서 승객을 찾습니다. 수하물 재검사가 필요합니다. 현재 위탁하신 수하물이 탑재되지 않고 있습니다. 진에어 {destination}행, {namesRepeated}, 승객께서는 진에어 체크인 카운터나 탑승구로 오시어 직원의 안내를 받아주시기 바랍니다. 감사합니다.",
      "inputs": [
        {
          "type": "textarea",
          "key": "names",
          "label": "Passenger name(s)",
          "placeholder": "e.g. KIM CHULSOO, LEE YOUNGHEE",
          "required": true,
          "translate": true
        },
        {
          "type": "repeat",
          "key": "nameRepeat",
          "label": "Name repeats",
          "default": 2,
          "min": 1,
          "max": 9
        }
      ],
      "derived": [
        {
          "key": "namesRepeated",
          "template": "{names}",
          "repeatKey": "nameRepeat",
          "separator": ", "
        }
      ],
      "englishTemplate": "May I have your attention, please. Jin Air is paging {names}, travelling to {destination}. Your checked baggage requires additional security inspection and cannot be loaded until the inspection has been completed. Please report to the Jin Air check-in counter or boarding gate and contact a member of our ground staff as soon as possible. Once again, {names}, please report to a Jin Air staff member. Thank you."
    },
    {
      "id": "4",
      "icon": "🛂",
      "tone": "immigration",
      "title": "Congested, please proceed to IMMG now",
      "summary": "Proceed to immigration",
      "language": "auto",
      "template": "진에어에서 출국 심사대 진입 안내 말씀 드리겠습니다. 공항이 혼잡하오니, 진에어 손님 여러분들께서는 탑승에 문제 없도록, 공항세를 납부하신 후 보안 검색대 및 출국 심사대로 바로 진입해주시기 바랍니다. 감사합니다.",
      "englishTemplate": "Attention, Jin Air passengers. Due to congestion in the terminal, please proceed to security screening and immigration as soon as you have paid the terminal fee. Please allow sufficient time to complete all departure formalities and reach your boarding gate. Thank you for your cooperation."
    },
    {
      "id": "5",
      "icon": "♿",
      "tone": "boarding",
      "title": "Pre-BRDG (PAX who need assistance)",
      "summary": "Pre-boarding assistance",
      "language": "auto",
      "template": "진에어에서 도움이 필요하신 승객의 탑승 안내 말씀 드리겠습니다. 만 2 세 미만, 유아를 동반하신 승객이나, 임산부, 노약자 등, 도움이 필요하신 승객께서는, 진에어 {destination}행 {flightNumber}편의 탑승이 곧 시작될 예정이오니, 지금, 먼저 앞으로 나오시어 탑승을 우선 대기해주시기 바랍니다. 다른 승객분들께서는 일반 탑승 안내를 기다려주시기 바랍니다. 감사합니다.",
      "englishTemplate": "May I have your attention, please. We will shortly begin boarding Jin Air flight {flightNumber}, bound for {destination}. At this time, we invite passengers requiring assistance, expectant mothers, elderly passengers, and passengers travelling with infants under two years of age to come forward and prepare for priority boarding. All other passengers, please remain seated and wait for the general boarding announcement. Thank you."
    },
    {
      "id": "6",
      "icon": "🛫",
      "tone": "boarding",
      "title": "Commence Boarding (General)",
      "summary": "General boarding",
      "language": "auto",
      "template": "진에어에서 탑승 시작 안내 말씀 드리겠습니다. 진에어 {flightNumber}편, {destination}행 항공편은, 지금부터 탑승을 시작하겠습니다. 진에어 {destination}행 승객여러분들께서는, {gateRepeated} 탑승구로 지금 탑승해주시기 바랍니다. 탑승구에서 탑승권과 여권을 개인별로 확인하고 있습니다. 탑승구 직원에게 본인 성함의 탑승권과 여권을 보여주시기 바랍니다. 감사합니다.",
      "inputs": [
        {
          "type": "number",
          "key": "gate",
          "label": "Gate number",
          "placeholder": "e.g. 3",
          "required": true,
          "min": 1,
          "max": 99
        },
        {
          "type": "repeat",
          "key": "gateRepeat",
          "label": "Gate repeats",
          "default": 2,
          "min": 1,
          "max": 9
        }
      ],
      "derived": [
        {
          "key": "gateRepeated",
          "template": "{gate}번",
          "repeatKey": "gateRepeat",
          "separator": ", "
        }
      ],
      "englishTemplate": "May I have your attention, please. Jin Air flight {flightNumber}, bound for {destination}, is now ready for boarding at Gate {gate}. All passengers are invited to board at this time. Please have your boarding pass and passport ready for inspection before approaching the gate. Once again, Jin Air flight {flightNumber}, bound for {destination}, is now boarding at Gate {gate}. Thank you."
    },
    {
      "id": "7",
      "icon": "🚶",
      "tone": "boarding",
      "title": "In the middle of Boarding",
      "summary": "Boarding in progress",
      "language": "auto",
      "template": "진에어에서 탑승 안내 말씀 드리겠습니다. 진에어 {destination}행 {flightNumber}편은 현재 탑승, 탑승 중에 있습니다. 진에어 손님 여러분들께서는 {gateRepeated} 탑승구로 탑승을 마쳐주시기 바랍니다. 진에어 {destination}행 {flightNumber}편이 탑승 진행 중입니다. 감사합니다.",
      "inputs": [
        {
          "type": "number",
          "key": "gate",
          "label": "Gate number",
          "placeholder": "e.g. 3",
          "required": true,
          "min": 1,
          "max": 99
        },
        {
          "type": "repeat",
          "key": "gateRepeat",
          "label": "Gate repeats",
          "default": 2,
          "min": 1,
          "max": 9
        }
      ],
      "derived": [
        {
          "key": "gateRepeated",
          "template": "{gate}번",
          "repeatKey": "gateRepeat",
          "separator": ", "
        }
      ],
      "englishTemplate": "May I have your attention, please. Boarding is now in progress for Jin Air flight {flightNumber}, bound for {destination}. All passengers who have not yet boarded are requested to proceed to Gate {gate} and complete boarding as soon as possible. Once again, Jin Air flight {flightNumber}, bound for {destination}, is now boarding at Gate {gate}. Thank you."
    },
    {
      "id": "8",
      "icon": "⏰",
      "tone": "boarding",
      "title": "Final Call for Boarding",
      "summary": "Final boarding call",
      "language": "auto",
      "template": "진에어에서 탑승 마감 예정, {destination}행 {flightNumber}편의 출발 예정 안내 말씀 드리겠습니다. 진에어 {destination}행 {flightNumber}편은 이제 곧 탑승을 마감하고, 출발할 예정입니다. 아직까지 탑승하시지 않은 진에어 승객 여러분들께서는 서둘러 {gateRepeated} 탑승구로 이동해주시기 바랍니다. 진에어가 곧 탑승을 마감하겠습니다. 곧 출발하겠습니다. 감사합니다.",
      "inputs": [
        {
          "type": "number",
          "key": "gate",
          "label": "Gate number",
          "placeholder": "e.g. 3",
          "required": true,
          "min": 1,
          "max": 99
        },
        {
          "type": "repeat",
          "key": "gateRepeat",
          "label": "Gate repeats",
          "default": 2,
          "min": 1,
          "max": 9
        }
      ],
      "derived": [
        {
          "key": "gateRepeated",
          "template": "{gate}번",
          "repeatKey": "gateRepeat",
          "separator": ", "
        }
      ],
      "englishTemplate": "Attention, please. This is the final boarding call for Jin Air flight {flightNumber}, bound for {destination}. All remaining passengers are requested to proceed immediately to Gate {gate}. The gate will be closing shortly and the flight is preparing for departure. Once again, this is the final boarding call for Jin Air flight {flightNumber}, Gate {gate}. Thank you."
    },
    {
      "id": "9",
      "icon": "🗣️",
      "tone": "boarding",
      "title": "Final Call for Boarding (With Name)",
      "summary": "Final boarding call with names",
      "language": "auto",
      "template": "진에어에서 탑승 마감 예정, {destination}행 {flightNumber}편의 출발 예정 안내 말씀 드리겠습니다. 진에어 {destination}행 {flightNumber}편은 이제 곧 탑승을 마감하고, 출발할 예정입니다. 아직까지 탑승하시지 않으신, {namesRepeated}, 승객께서는 서둘러 {gateRepeated} 탑승구로 이동해주시기 바랍니다. 진에어가 곧 탑승을 마감하겠습니다. 곧 출발하겠습니다. 감사합니다.",
      "inputs": [
        {
          "type": "textarea",
          "key": "names",
          "label": "Passenger name(s)",
          "placeholder": "e.g. KIM CHULSOO, LEE YOUNGHEE",
          "required": true,
          "translate": true
        },
        {
          "type": "repeat",
          "key": "nameRepeat",
          "label": "Name repeats",
          "default": 2,
          "min": 1,
          "max": 9
        },
        {
          "type": "number",
          "key": "gate",
          "label": "Gate number",
          "placeholder": "e.g. 3",
          "required": true,
          "min": 1,
          "max": 99
        },
        {
          "type": "repeat",
          "key": "gateRepeat",
          "label": "Gate repeats",
          "default": 2,
          "min": 1,
          "max": 9
        }
      ],
      "derived": [
        {
          "key": "namesRepeated",
          "template": "{names}",
          "repeatKey": "nameRepeat",
          "separator": ", "
        },
        {
          "key": "gateRepeated",
          "template": "{gate}번",
          "repeatKey": "gateRepeat",
          "separator": ", "
        }
      ],
      "englishTemplate": "Attention, please. This is the final boarding call for {names}, travelling on Jin Air flight {flightNumber}, bound for {destination}. Please proceed immediately to Gate {gate}. The gate will be closing shortly and final departure preparations are underway. Once again, {names}, please report to Gate {gate} immediately. Thank you."
    },
    {
      "id": "10",
      "icon": "🔀",
      "tone": "gate",
      "title": "Gate CHG to #1~#7",
      "summary": "Gate change · Gates 1–7",
      "language": "auto",
      "template": "진에어에서 탑승구 변경 안내 말씀 드리겠습니다. 진에어 {flightNumber}편, {destination}행 항공편의 탑승구는 {locationRepeated}으로 변경되었습니다. 진에어 손님여러분들께서는 탑승구 {gate}번 주변 좌석에서 대기해주시기 바랍니다. 감사합니다.",
      "inputs": [
        {
          "type": "number",
          "key": "floor",
          "label": "Floor",
          "placeholder": "e.g. 2",
          "required": true,
          "min": 1,
          "max": 9
        },
        {
          "type": "number",
          "key": "gate",
          "label": "New gate",
          "placeholder": "1–7",
          "required": true,
          "min": 1,
          "max": 7
        },
        {
          "type": "repeat",
          "key": "locationRepeat",
          "label": "Floor / gate repeats",
          "default": 2,
          "min": 1,
          "max": 9
        }
      ],
      "derived": [
        {
          "key": "locationRepeated",
          "template": "{floor}층 {gate}번",
          "repeatKey": "locationRepeat",
          "separator": ", "
        }
      ],
      "englishTemplate": "May I have your attention, please. There has been a gate change for Jin Air flight {flightNumber}, bound for {destination}. The new boarding gate is Gate {gate} on Level {floor}. Please proceed to the new gate and remain in the seating area near Gate {gate} until boarding. Once again, Jin Air flight {flightNumber} will depart from Gate {gate} on Level {floor}. Thank you."
    },
    {
      "id": "11",
      "icon": "⬇️",
      "tone": "gate",
      "title": "Gate CHG to #8~#10 (Lower floor of Gate #7)",
      "summary": "Gate change · Gates 8–10",
      "language": "auto",
      "template": "진에어에서 탑승구 변경 안내 말씀 드리겠습니다. 진에어 {flightNumber}편, {destination}행 항공편의 탑승구는 1층 {gate}번, 1층 {gate}번으로 변경되었습니다. 진에어 손님여러분들께서는 2층 7번 탑승구로 먼저 이동하신 후, 7번 탑승구 맞은편에 있는 계단이나 엘리베이터를 이용하시어 아래층으로 이동하시면 {gate}번, 진에어 탑승구 {gate}번으로 이동하실 수 있습니다. 변경된 탑승구 {gate}번 주변 좌석에서 대기해주시기 바랍니다. 감사합니다.",
      "inputs": [
        {
          "type": "select",
          "key": "gate",
          "label": "New gate number (8–10)",
          "required": true,
          "default": "8",
          "options": [
            "8",
            "9",
            "10"
          ],
          "placeholder": "e.g. 3"
        }
      ],
      "englishTemplate": "May I have your attention, please. There has been a gate change for Jin Air flight {flightNumber}, bound for {destination}. The new boarding gate is Gate {gate} on Level 1. To reach Gate {gate}, please first proceed to Gate 7 on Level 2, then take the stairs or elevator opposite Gate 7 down to the lower level. Once again, the new boarding gate is Gate {gate} on Level 1. Please remain in the seating area near the new gate. Thank you."
    },
    {
      "id": "12",
      "icon": "🔋",
      "tone": "safety",
      "title": "Carrying Power Banks Onboard Regulations (KR)",
      "summary": "Power bank safety · Korean",
      "language": "auto",
      "template": "진에어에서 항공기 안전 운항을 위해, 배터리 관련 안내 말씀드리겠습니다. 진에어 기내에서, 보조배터리를 다른 기기에 연결해 사용하거나, 보조배터리 자체를 충전시키는 것은, 모두 엄격히 금지되어 있습니다. 아울러 보조배터리를 기내 상단 선반에 보관하는 것이 금지되어 있으므로, 반드시 직접 휴대하거나 좌석 앞 주머니에 보관해주시기 바랍니다. 또한 단락 방지 및 사용 방지를 위해 절연 테이프를 부착해주시기 바랍니다. 보조배터리는 일인당 최대 두개까지 기내 반입이 가능합니다. 감사합니다.",
      "englishTemplate": "May I have your attention, please. For the safe operation of our flight, Jin Air would like to remind passengers of the following requirements for carrying power banks on board. Power banks must not be used to charge or operate other devices during the flight, and the power banks themselves must not be recharged on board. They must not be stored in the overhead bins. Please keep them with you or place them in the seat pocket in front of you. To prevent short circuits, please insulate the terminals with tape. A maximum of two power banks per passenger may be carried on board. Thank you for your cooperation."
    },
    {
      "id": "13",
      "icon": "🔋",
      "tone": "safety",
      "title": "Carrying Power Banks Onboard Regulations (EN)",
      "summary": "Power bank safety · English",
      "language": "en",
      "template": "Your attention please. This is a safety announcement from Jin Air, regarding battery usage, onboard the aircraft. Please be advised that the use of power banks by connecting them to other devices, as well as charging the power banks themselves, is strictly prohibited onboard the aircraft. In addition, power banks must not be stored in the overhead compartments. Please ensure that you keep them on your person at all times, or place them in the seat pocket in front of you. Furthermore, to prevent short circuits and unauthorized use, we kindly ask that you apply insulating tape, to the terminals of your power banks. Passengers are allowed to carry onboard a maximum of two power banks per person. Thank you for your cooperation."
    },
    {
      "id": "14",
      "icon": "⏳",
      "tone": "delay",
      "title": "FLT DLY - Due to A/C CONX (1st, In the middle of disembarkation)",
      "summary": "Flight delay · Disembarkation",
      "language": "auto",
      "template": "진에어에서 죄송한 탑승 지연 안내 말씀 드리겠습니다. 진에어 {destination}행, {flightNumber}편은, 선행 도착편의 지연 도착으로, 현재 선행 도착편 승객분들의 하기가 진행 중입니다. 승객 하기가 끝나고, 기내 청소, 기내 준비가 끝나면 방송으로 안내해드리겠습니다. 예상되는 탑승 예정 시각은 {timeRepeated} 경 입니다. 진에어 {flightNumber}편 승객 여러분들께서는 먼저 탑승구 앞으로 나와 줄 서지 마시고, 주변 좌석에 앉아 다음 안내 방송을 기다려주시기 바랍니다. 감사합니다.",
      "inputs": [
        {
          "type": "number",
          "key": "hour",
          "label": "Hour",
          "placeholder": "HH",
          "required": true,
          "min": 0,
          "max": 23
        },
        {
          "type": "number",
          "key": "minute",
          "label": "Minute",
          "placeholder": "MM",
          "required": true,
          "min": 0,
          "max": 59
        },
        {
          "type": "repeat",
          "key": "timeRepeat",
          "label": "Time repeats",
          "default": 2,
          "min": 1,
          "max": 9
        }
      ],
      "derived": [
        {
          "key": "timeRepeated",
          "template": "{hour}시 {minute}분",
          "repeatKey": "timeRepeat",
          "separator": ", "
        }
      ],
      "englishTemplate": "May I have your attention, please. We apologize for the delay to boarding Jin Air flight {flightNumber}, bound for {destination}. The inbound aircraft arrived behind schedule, and arriving passengers are currently disembarking. Once disembarkation, cabin cleaning, and final cabin preparations have been completed, we will begin boarding. Our estimated boarding time is {hour}:{minute}. Please remain seated in the gate area and do not line up at the boarding gate until a further announcement is made. Thank you for your patience and understanding."
    },
    {
      "id": "15",
      "icon": "🧹",
      "tone": "delay",
      "title": "FLT DLY - Due to A/C CONX (2nd, In the middle of cabin preparation)",
      "summary": "Flight delay · Cabin preparation",
      "language": "auto",
      "template": "거듭하여, 진에어에서 죄송한 탑승 지연 안내 말씀 드리겠습니다. 진에어 {destination}행, {flightNumber}편은, 선행 도착편의 지연 도착으로, 현재 기내 청소 및 준비가 진행 중입니다. 예상되는 탑승 예정 시각은 {timeRepeated} 경 입니다. 진에어 {flightNumber}편 승객 여러분들께서는 먼저 탑승구 앞으로 나와 줄 서지 마시고, 주변 좌석에 앉아 다음 안내 방송을 기다려주시기 바랍니다. 감사합니다.",
      "inputs": [
        {
          "type": "number",
          "key": "hour",
          "label": "Hour",
          "placeholder": "HH",
          "required": true,
          "min": 0,
          "max": 23
        },
        {
          "type": "number",
          "key": "minute",
          "label": "Minute",
          "placeholder": "MM",
          "required": true,
          "min": 0,
          "max": 59
        },
        {
          "type": "repeat",
          "key": "timeRepeat",
          "label": "Time repeats",
          "default": 2,
          "min": 1,
          "max": 9
        }
      ],
      "derived": [
        {
          "key": "timeRepeated",
          "template": "{hour}시 {minute}분",
          "repeatKey": "timeRepeat",
          "separator": ", "
        }
      ],
      "englishTemplate": "May I have your attention, please. We would like to provide an update regarding the delayed boarding of Jin Air flight {flightNumber}, bound for {destination}. Due to the late arrival of the inbound aircraft, cabin cleaning and final preparations are still in progress. Our estimated boarding time is {hour}:{minute}. Please remain seated in the gate area and wait for the next boarding announcement rather than forming a line at the gate. We apologize for the delay and thank you for your patience."
    },
    {
      "id": "16",
      "icon": "📢",
      "tone": "paging",
      "title": "Passenger Paging (General)",
      "summary": "General passenger paging",
      "language": "auto",
      "template": "진에어에서 승객을 찾습니다. 진에어 {pagingDestinationKo}행에 탑승하시는 {namesRepeated} 승객께서는 진에어 {locationKo}로 오시어 직원의 안내를 받아주시기 바랍니다. 감사합니다.",
      "inputs": [
        {
          "type": "destination",
          "key": "pagingDestination",
          "label": "Destination",
          "required": true
        },
        {
          "type": "choice",
          "key": "location",
          "label": "Proceed to",
          "required": true,
          "default": "GATE",
          "options": [
            {
              "value": "CNTR",
              "label": "CNTR",
              "ko": "카운터",
              "en": "counter"
            },
            {
              "value": "GATE",
              "label": "GATE",
              "ko": "탑승구",
              "en": "boarding gate"
            },
            {
              "value": "CNTR_OR_GATE",
              "label": "CNTR or GATE",
              "ko": "카운터나 탑승구",
              "en": "counter or boarding gate"
            }
          ]
        },
        {
          "type": "textarea",
          "key": "names",
          "label": "Passenger name(s)",
          "placeholder": "e.g. KIM CHULSOO, LEE YOUNGHEE",
          "required": true,
          "translate": true
        },
        {
          "type": "repeat",
          "key": "nameRepeat",
          "label": "Name repeats",
          "default": 2,
          "min": 1,
          "max": 9
        }
      ],
      "derived": [
        {
          "key": "namesRepeated",
          "template": "{names}",
          "repeatKey": "nameRepeat",
          "separator": ", "
        }
      ],
      "englishTemplate": "May I have your attention, please. Jin Air is paging {names}, travelling to {pagingDestinationEn}. Please report to the Jin Air {locationEn} and speak with a member of our ground staff. Once again, {names}, please report to the Jin Air {locationEn}. Thank you."
    }
  ]
};
