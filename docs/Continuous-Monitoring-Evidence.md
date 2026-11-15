# Do astronauts have continuous health monitoring?

*Evidence review for AetherHealth, using NASA and CSA sources only. Compiled 2026-11-15.*

## Short answer

**Not for vital signs in routine operations, but yes for some specific things.**

On the ISS today, routine crew health checks are **periodic**: weekly private medical conferences and occasional health status evaluations. Heart rate and ECG are not streamed 24/7. Continuous or live monitoring is used in a few specific cases:

| What | When it is continuous or live | Source |
|---|---|---|
| ECG and heart rate, suit CO₂, metabolic rate | **During EVA only**, watched live by the ground | OCHMO-STD-100.1A [6030] [1]; NASA telemedicine brief [3] |
| Sleep (actigraphy) | **Continuously throughout the mission** (example schedule) | OCHMO-STD-100.1A [6039] [1] |
| Radiation dose | Throughout the mission, with personal dosimetry | OCHMO-STD-100.1A [6022] [1] |
| Full vital signs (ECG, BP, SpO₂, breathing, skin temperature, activity) | In **recording sessions** (for example 24 h) with CSA's Bio-Monitor, a research and technology system | CSA [5]; NASA ISS blog [6] |

For deep-space missions, NASA describes the gap like this: today's monitoring relies on the ground, and exploration missions will need **space-based** (onboard) monitoring [3].

---

## 1. What NASA's medical standard requires in flight

NASA's *Space Flight Medical Selection, Recertification and Mission Evaluation* standard (OCHMO-STD-100.1A, Rev. A, released 09/09/2024) sets the in-flight medical schedule [1]:

- **Private Medical Conference [6003]:** its purpose is "to monitor crewmember health". The example ISS schedule is L+1–7 days, **weekly**, before and after EVA, and daily in the last 5 days before return.
- **CMO Health Status Evaluations [6002]:** periodic in-flight checks of history and vital signs (temperature, blood pressure, pulse, respiratory rate). The standard notes that "trending of data has not indicated any abnormalities" and **recommends testing based on symptoms**.
- **24-hour ambulatory ECG:** listed for **before and after flight** (for example L-365/330 d, R+0, R+10/14 d), not as a continuous in-flight requirement.
- **Monitoring during EVA [6030]:** "To monitor crew health during the EVA … and provide immediate feedback to the EVA Flight Director." Past missions included "ECG and derived heart rate, suit pressure, suit CO2 partial pressure, O2 tank pressure and derived metabolic rate, personal radiation dosimetry, and when possible, real-time personal dosimetry."
- **Objective Measure of Sleep [6039]:** example schedule is "in-flight **continuously** throughout mission", using an actimetry sensor, with data that "can be downloaded remotely" and discussed at the weekly private medical conference.
- **Radiation Monitoring [6022]:** radiation "must be monitored throughout the course of a mission" with crew personal dosimetry.

**What this means:** NASA's own standard puts continuous monitoring on **sleep, radiation and EVA**, and checks other vital signs periodically and when symptoms appear.

## 2. Historical practice (NASA Evidence Report)

The NASA Human Research Program *Evidence Report: Risk of Cardiac Rhythm Problems During Spaceflight* (2017) [2] records:

- **Space Shuttle:** "During the first 4 flights … ECG was monitored continuously … In subsequent missions **routine ECG monitoring was conducted only during EVA**."
- **ISS:** arrhythmia data came from **24-h Holter recordings** taken before, during and after missions in a research study (Integrated Cardiovascular Study), not from continuous operational monitoring. In 2 of 13 participants, arrhythmias became more frequent.

## 3. NASA's view on monitoring for exploration missions

The NASA telemedicine brief *NASA and Telemedicine: Now and Beyond* (Antonsen and Walton, Exploration Medical Capability, JSC, 2017) [3]:

- Lists four types of telemedicine: live remote guidance, **live monitoring**, store-and-forward, and **autonomous**.
- On ISS EVA: "Live monitoring by ground (including prebreathe)". Lessons learned: "Additional EVA crew bioinformatics needed."
- Current ISS versus exploration: live monitoring and private medical conferences are "**reliant on ground**", and exploration needs "**space-based**" monitoring.

NASA project summary, *Miniature Biometric Sensor Project* (2014–2015) [4]:

- "Heart rate monitoring is a **medical requirement** during ISS exercise, fitness tests, and extravehicular activity (EVA); however, NASA does not currently have the technology to consistently and accurately monitor heart rate … during ISS daily exercise sessions or EVA's."
- ISS used "four separate systems". The available sensors "are dependent on uninterrupted contact with the skin and are prone to data drop-out and motion artifact."
- "Providing the crew with visual feedback … will advance the goals of autonomous crew health care needed for exploration missions."

## 4. CSA Bio-Monitor (and the Astroskin prototype)

**CSA Bio-Monitor** [5] is a smart shirt, headband and tablet app, launched to the ISS in December 2018. It measures heart rate and ECG, blood pressure, breathing rate and volume, skin temperature, blood oxygen saturation and activity. It can be worn during sleep and exercise. After a session, the battery pack is docked to a base that downloads the data and sends it to Earth through the station's communications system. This is **store-and-forward, not live streaming**.

**NASA ISS blog, 21 July 2026** [6]: CSA is testing whether Bio-Monitor can "comfortably and continuously monitor health throughout an astronaut's shift". A NASA flight engineer "wore the health-wear for a **24-hour recording session**." It is still described as testing, not as a standard operational tool.

**NASA–CSA HERA analog study (Toscano et al., NASA HRP Investigators' Workshop 2017)** [7]: Astroskin was tested on 30-day analog crews, with "continuous physiological monitoring – 24 hours". Lessons learned:
- "real-time data streaming via Bluetooth … significantly reduces battery life resulting in less than 24-hour recordings"
- "24-hour ambulatory monitoring was possible when data are stored on the embedded Astroskin module (no real-time streaming)"
- "SpO2 sensor/headband causes significant discomfort when worn for 24 hour period"
- A stated goal: baseline data for algorithms supporting "diagnosis of sick or injured crew".

NASA Ames abstract [8] calls Astroskin "an autonomous medical monitoring system".

---

## 5. Should AetherHealth add continuous monitoring?

**Yes, but in the forms NASA and CSA actually use, not as 24/7 vital-sign streaming.** The sources support these four additions:

1. **Continuous sleep tracking (actigraphy).** This is the one vital-type measure NASA's standard schedules as continuous throughout the mission [1]. The app logs sleep at check-in today; an actigraphy stream fits [6039] directly.
2. **Event-based live monitoring for EVA and exercise.** NASA requires ECG and heart rate during EVA [1] and heart-rate monitoring during exercise and fitness tests [4]. A "live session" mode that streams HR, ECG and SpO₂ and alerts on band breaches during these activities matches practice. With delayed communications, the alerting has to run **onboard** ("space-based") [3].
3. **Bio-Monitor-style recording sessions (for example 24 h), store-and-forward.** Record onboard, then sync. HERA showed this works where real-time streaming drains the battery [7], and it is how Bio-Monitor sends data to the ground today [5].
4. **Continuous radiation dose.** Already supported by the evidence: NASA requires mission-long dosimetry [1], and the app already cites CSA's continuous autonomous dose monitoring.

**Keep the daily check-in as the core.** It mirrors NASA's periodic, symptom-based model (weekly private medical conferences and health status evaluations [1]). Continuous vitals are a research direction, not current operational practice [2][5][6].

**Design constraints from the evidence:**
- Expect data dropouts and motion artifacts. Show signal quality and don't alert on missing data alone [4][7].
- Comfort limits how long people wear sensors. Make sessions opt-in and time-boxed [7].
- Prefer onboard storage with sync later over constant streaming [5][7].
- Sensors in the app today are **simulated** ("Fill from sensors"). Any continuous feed should stay labelled as simulated until real hardware is connected.

### Implemented in the app (Monitor page)

| Recommendation | What was built | Code |
|---|---|---|
| Continuous sleep tracking | Actigraphy card: last night's sleep, efficiency, awakenings, movement per 10-min epoch, last 7 nights, compared with the self-reported check-in value | `src/features/monitor/MonitorPage.tsx` (`SleepCard`), `src/data/monitorSim.ts` (`actigraphyNights`) |
| Live EVA / exercise monitoring | Live HR, SpO₂, breathing and signal quality. Alerts run on the device, need several good samples in a row, and treat dropouts as "signal lost" rather than a health alert | `src/domain/monitoring.ts` (`MonitorEngine`), `src/features/monitor/useLiveMonitor.ts` |
| 24-h recording sessions | Full-day session (real time, 60× or 600× for demos), saved on the device and marked "Queued for downlink" until it goes out in the ground packet | `src/data/monitorRepo.ts`, `src/data/exportPacket.ts` |
| Continuous radiation dose | Live dosimeter card: dose rate, dose since midnight, NASA design limit, NASA DONKI solar-event warning | `MonitorPage.tsx` (`DoseCard`) |

All Monitor-page signals are simulated. The exercise and EVA heart-rate ceiling (85 / 95 / 100% of 220 − age, with age 40 assumed) is an app heuristic, not a NASA limit. SpO₂ uses the app's existing WHO-based bands, and resting/sleep HR uses the check-in bands.

---

## References

1. NASA Office of the Chief Health and Medical Officer. *NASA Space Flight Medical Selection, Recertification and Mission Evaluation*, OCHMO-STD-100.1A, Revision A, 09/09/2024. Requirements [6002], [6003], [6022], [6030], [6039]. https://www.nasa.gov/wp-content/uploads/2023/04/ochmo-std-100.1a.pdf
2. Lee, S. M. C., et al. *Evidence Report: Risk of Cardiac Rhythm Problems During Spaceflight*. NASA Human Research Program, approved for public release June 12, 2017. NTRS 20170005625. https://ntrs.nasa.gov/api/citations/20170005625/downloads/20170005625.pdf
3. Antonsen, E., and Walton, M. *NASA and Telemedicine: Now and Beyond*. Exploration Medical Capability, NASA Johnson Space Center, May 9, 2017. NTRS 20170009943. https://ntrs.nasa.gov/api/citations/20170009943/downloads/20170009943.pdf
4. NASA. *Miniature Biometric Sensor Project* (project summary, 2014–2015). NTRS 20150016028. https://ntrs.nasa.gov/api/citations/20150016028/downloads/20150016028.pdf
5. Canadian Space Agency. *Bio-Monitor: Keeping an eye on astronauts' vital signs*. https://www.asc-csa.gc.ca/eng/sciences/astroskin.asp
6. NASA Space Station Blog. *Biomedical Research, Crew Swap Operations Pack Busy Day Aboard Station*, July 21, 2026. https://www.nasa.gov/blogs/spacestation/2026/07/21/biomedical-research-crew-swap-operations-pack-busy-day-aboard-station/
7. Toscano, B., et al. (NASA Ames and Canadian Space Agency). *Wearable Biosensor Monitor to Support Autonomous Crew Health and Readiness to Perform*. NASA Human Research Program Investigators' Workshop, 2017. NTRS 20190001996. https://ntrs.nasa.gov/api/citations/20190001996/downloads/20190001996.pdf
8. DeLeon, R., Cowings, P., and Toscano, B. *Wearable Biosensor Monitor to Support Autonomous Crew Health and Performance*. NASA Ames Research Center, 2016. NTRS 20190000238. https://ntrs.nasa.gov/citations/20190000238
