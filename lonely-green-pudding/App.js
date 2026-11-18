import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Vibration,
} from 'react-native';

const COLORS = {
  BG_DARK: '#121621',
  CARD_BG: '#1c2230',
  HEADER_BG: '#1e3a8a',
  ACCENT_CYAN: '#38bdf8',
  ACCENT_GREEN: '#34d399',
  ACCENT_AMBER: '#fbbf24',
  TEXT_LIGHT: '#f1f5f9',
  TEXT_MUTED: '#94a3b8',
  BORDER: '#334155',
  DANGER: '#f87171',
};

const MAX_TRIES = 10;
const INITIAL_TIME = 120; // 2 minutes in seconds

export default function App() {
  const [secretCode, setSecretCode] = useState('');
  const [digitCount, setDigitCount] = useState(4);
  const [digitSum, setDigitSum] = useState(0);
  const [hasZero, setHasZero] = useState(false);
  const [currentAttempt, setCurrentAttempt] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [guessInput, setGuessInput] = useState('');
  const [history, setHistory] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);

  const scrollViewRef = useRef(null);
  const audioCtxRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    startNewGame();
    return () => clearInterval(timerRef.current);
  }, []);

  // Countdown Timer Effect
  useEffect(() => {
    if (gameOver) {
      clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [gameOver, secretCode]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleTimeOut = () => {
    playCyberSound('gameover');
    setGameOver(true);
    setHistory((prev) => [
      ...prev,
      '⏱ TIME EXPIRED -> SYSTEM LOCKOUT!',
      '----------------------------------------',
    ]);
    Alert.alert(
      'Time Expired! ⏱',
      `System locked down! You ran out of time.\nThe secret code was: ${secretCode}`,
      [
        { text: 'Close', style: 'cancel' },
        { text: 'Try Again', onPress: startNewGame },
      ]
    );
  };

  // Synthesize cyber/hack sound effects using Web Audio API + Haptics
  const playCyberSound = (type) => {
    if (!soundEnabled) return;

    if (Platform.OS !== 'web') {
      if (type === 'win') {
        Vibration.vibrate([0, 80, 60, 160]);
      } else if (type === 'wrong') {
        Vibration.vibrate([0, 120, 50, 120]);
      } else if (type === 'gameover') {
        Vibration.vibrate(400);
      } else if (type === 'click') {
        Vibration.vibrate(25);
      }
    }

    try {
      const AudioContext =
        typeof window !== 'undefined' &&
        (window.AudioContext || window.webkitAudioContext);
      if (!AudioContext) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      if (type === 'click') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(920, now);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === 'wrong') {
        [0, 0.14].forEach((offset) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(155, now + offset);
          osc.frequency.linearRampToValueAtTime(95, now + offset + 0.11);
          gain.gain.setValueAtTime(0.14, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.12);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + offset);
          osc.stop(now + offset + 0.12);
        });
      } else if (type === 'win') {
        const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
        notes.forEach((freq, idx) => {
          const offset = idx * 0.075;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, now + offset);
          gain.gain.setValueAtTime(0.11, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.16);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + offset);
          osc.stop(now + offset + 0.16);
        });
      } else if (type === 'gameover') {
        const notes = [293.66, 220.0, 146.83];
        notes.forEach((freq, idx) => {
          const offset = idx * 0.16;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now + offset);
          gain.gain.setValueAtTime(0.13, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.22);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + offset);
          osc.stop(now + offset + 0.22);
        });
      }
    } catch (e) {}
  };

  const startNewGame = () => {
    clearInterval(timerRef.current);
    playCyberSound('click');
    const count = Math.random() < 0.5 ? 4 : 5;
    let code = String(Math.floor(Math.random() * 9) + 1);
    for (let i = 1; i < count; i++) {
      code += String(Math.floor(Math.random() * 10));
    }

    let sum = 0;
    let zeroFound = false;
    for (let i = 0; i < code.length; i++) {
      const d = parseInt(code[i], 10);
      sum += d;
      if (d === 0) zeroFound = true;
    }

    setDigitCount(count);
    setSecretCode(code);
    setDigitSum(sum);
    setHasZero(zeroFound);
    setCurrentAttempt(1);
    setGameOver(false);
    setGuessInput('');
    setTimeLeft(INITIAL_TIME);
    setHistory([
      `System ready. Enter a ${count}-digit code above.`,
      '----------------------------------------',
    ]);
  };

  const evaluateGuess = (guess) => {
    let exactMatch = 0;
    let digitMatch = 0;
    const secretUsed = Array(digitCount).fill(false);
    const guessUsed = Array(digitCount).fill(false);
    const exactDigits = [];
    const wrongPosDigits = [];

    for (let i = 0; i < digitCount; i++) {
      if (guess[i] === secretCode[i]) {
        exactMatch++;
        exactDigits.push(guess[i]);
        secretUsed[i] = true;
        guessUsed[i] = true;
      }
    }

    for (let i = 0; i < digitCount; i++) {
      if (guessUsed[i]) continue;
      for (let j = 0; j < digitCount; j++) {
        if (!secretUsed[j] && guess[i] === secretCode[j]) {
          digitMatch++;
          wrongPosDigits.push(guess[i]);
          secretUsed[j] = true;
          break;
        }
      }
    }

    const exactStr = exactDigits.length > 0 ? exactDigits.join(' ') : 'None';
    const wrongStr = wrongPosDigits.length > 0 ? wrongPosDigits.join(' ') : 'None';

    return (
      `  ✔ Positioned correctly (${exactMatch}): [ ${exactStr} ]\n` +
      `  ➜ Exists, wrong spot   (${digitMatch}): [ ${wrongStr} ]`
    );
  };

  const handleKeyPress = (key) => {
    if (gameOver) return;
    playCyberSound('click');

    if (key === 'CLR') {
      setGuessInput('');
    } else if (key === 'DEL') {
      setGuessInput((prev) => prev.slice(0, -1));
    } else {
      if (guessInput.length < digitCount) {
        setGuessInput((prev) => prev + key);
      }
    }
  };

  const handleGuess = () => {
    if (gameOver) return;

    const guess = guessInput.trim();
    const regex = new RegExp(`^\\d{${digitCount}}$`);

    if (!regex.test(guess)) {
      playCyberSound('wrong');
      Alert.alert('Invalid Input', `Please enter a valid ${digitCount}-digit number!`);
      return;
    }

    setGuessInput('');

    // Win check
    if (guess === secretCode) {
      clearInterval(timerRef.current);
      playCyberSound('win');
      setGameOver(true);
      setHistory((prev) => [
        ...prev,
        `Attempt ${currentAttempt}: ${guess} -> ACCESS GRANTED!`,
      ]);
      Alert.alert(
        'Access Granted! 🎉',
        `System breached! You cracked the code: ${secretCode}`,
        [
          { text: 'Close', style: 'cancel' },
          { text: 'Play Again', onPress: startNewGame },
        ]
      );
      return;
    }

    // Wrong guess feedback
    const feedback = evaluateGuess(guess);
    setHistory((prev) => [
      ...prev,
      `Attempt ${currentAttempt}: [ ${guess} ]\n${feedback}`,
      '----------------------------------------',
    ]);

    const nextAttempt = currentAttempt + 1;
    if (nextAttempt > MAX_TRIES) {
      clearInterval(timerRef.current);
      playCyberSound('gameover');
      setGameOver(true);
      Alert.alert(
        'System Lockout ❌',
        `You ran out of tries.\nThe secret code was: ${secretCode}`,
        [
          { text: 'Close', style: 'cancel' },
          { text: 'Try Again', onPress: startNewGame },
        ]
      );
    } else {
      playCyberSound('wrong');
      setCurrentAttempt(nextAttempt);
    }
  };

  const getTimerColor = () => {
    if (timeLeft <= 10) return COLORS.DANGER;
    if (timeLeft <= 30) return COLORS.ACCENT_AMBER;
    return COLORS.ACCENT_GREEN;
  };

  const keypadRows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['CLR', '0', 'DEL'],
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.BG_DARK} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header Banner */}
        <View style={styles.headerBanner}>
          <Text style={styles.lockIcon}>🔒</Text>
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>CIPHER BREAKER</Text>
            <Text style={styles.headerSubtitle}>Crack the hidden numeric passcode</Text>
          </View>
          <TouchableOpacity
            style={styles.soundToggle}
            onPress={() => setSoundEnabled((prev) => !prev)}
          >
            <Text style={styles.soundToggleText}>{soundEnabled ? '🔊' : '🔇'}</Text>
          </TouchableOpacity>
        </View>

        {/* Secret Code Clues Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>SECRET CODE CLUES</Text>
          <Text style={styles.clueText}>• Total number of digits: {digitCount}</Text>
          <Text style={styles.clueText}>• Sum of all digits: {digitSum}</Text>
          {hasZero && (
            <Text style={styles.zeroClueText}>
              • Special Clue: The code contains at least one '0'!
            </Text>
          )}
        </View>

        {/* Input & Keypad Card */}
        <View style={styles.card}>
          <View style={styles.statusRow}>
            <View>
              <Text style={styles.cardTitle}>ENTER YOUR GUESS</Text>
              <Text
                style={[
                  styles.attemptText,
                  gameOver && currentAttempt >= MAX_TRIES && { color: COLORS.DANGER },
                ]}
              >
                {gameOver && currentAttempt >= MAX_TRIES
                  ? 'Out of tries!'
                  : `Attempt ${currentAttempt} of ${MAX_TRIES}`}
              </Text>
            </View>

            {/* Countdown Timer Badge */}
            <View style={[styles.timerBadge, { borderColor: getTimerColor() }]}>
              <Text style={styles.timerLabel}>TIME LEFT</Text>
              <Text style={[styles.timerText, { color: getTimerColor() }]}>
                ⏱ {formatTime(timeLeft)}
              </Text>
            </View>
          </View>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={guessInput}
              showSoftInputOnFocus={false}
              placeholder={'•'.repeat(digitCount)}
              placeholderTextColor={COLORS.TEXT_MUTED}
              maxLength={digitCount}
              editable={!gameOver}
            />
            <TouchableOpacity
              style={[styles.crackButton, gameOver && styles.disabledButton]}
              onPress={handleGuess}
              disabled={gameOver}
            >
              <Text style={styles.crackButtonText}>CRACK</Text>
            </TouchableOpacity>
          </View>

          {/* Graphic Cyber Keypad */}
          <View style={styles.keypadContainer}>
            {keypadRows.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.keypadRow}>
                {row.map((key) => {
                  const isAction = key === 'CLR' || key === 'DEL';
                  return (
                    <TouchableOpacity
                      key={key}
                      activeOpacity={0.7}
                      disabled={gameOver}
                      onPress={() => handleKeyPress(key)}
                      style={[
                        styles.keyButton,
                        isAction && styles.keyActionButton,
                        gameOver && styles.disabledButton,
                      ]}
                    >
                      <Text
                        style={[
                          styles.keyText,
                          key === 'CLR' && { color: COLORS.DANGER, fontSize: 12 },
                          key === 'DEL' && { color: COLORS.ACCENT_AMBER, fontSize: 15 },
                        ]}
                      >
                        {key === 'DEL' ? '⌫' : key}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        {/* Decryption Log Card */}
        <View style={[styles.card, styles.historyCard]}>
          <Text style={styles.cardTitle}>DECRYPTION LOG</Text>
          <ScrollView
            ref={scrollViewRef}
            style={styles.historyBox}
            onContentSizeChange={() =>
              scrollViewRef.current?.scrollToEnd({ animated: true })
            }
          >
            {history.map((entry, idx) => (
              <Text key={idx} style={styles.historyText}>
                {entry}
              </Text>
            ))}
          </ScrollView>
        </View>

        {/* Bottom New Round Button */}
        <TouchableOpacity style={styles.newRoundButton} onPress={startNewGame}>
          <Text style={styles.newRoundText}>↻ Start New Round</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.BG_DARK,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.BG_DARK,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
  },
  headerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.HEADER_BG,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  lockIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  headerSubtitle: {
    color: COLORS.ACCENT_CYAN,
    fontSize: 11,
    marginTop: 1,
  },
  soundToggle: {
    backgroundColor: COLORS.BG_DARK,
    padding: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.ACCENT_CYAN,
  },
  soundToggleText: {
    fontSize: 16,
  },
  card: {
    backgroundColor: COLORS.CARD_BG,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  cardTitle: {
    color: COLORS.TEXT_MUTED,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  clueText: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  zeroClueText: {
    color: COLORS.ACCENT_AMBER,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 1,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  attemptText: {
    color: COLORS.ACCENT_CYAN,
    fontSize: 13,
    fontWeight: 'bold',
  },
  timerBadge: {
    backgroundColor: COLORS.BG_DARK,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  timerLabel: {
    color: COLORS.TEXT_MUTED,
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  timerText: {
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.BG_DARK,
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    borderWidth: 2,
    borderColor: COLORS.ACCENT_CYAN,
    borderRadius: 8,
    paddingVertical: 6,
    marginRight: 8,
    letterSpacing: 6,
  },
  crackButton: {
    backgroundColor: COLORS.ACCENT_CYAN,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  disabledButton: {
    opacity: 0.45,
  },
  crackButtonText: {
    color: COLORS.BG_DARK,
    fontSize: 12,
    fontWeight: 'bold',
  },
  keypadContainer: {
    backgroundColor: COLORS.BG_DARK,
    borderRadius: 8,
    padding: 6,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  keyButton: {
    flex: 1,
    backgroundColor: '#1e293b',
    marginHorizontal: 3,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#38bdf844',
  },
  keyActionButton: {
    backgroundColor: '#0f172a',
    borderColor: COLORS.BORDER,
  },
  keyText: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  historyCard: {
    flex: 1,
  },
  historyBox: {
    backgroundColor: COLORS.BG_DARK,
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  historyText: {
    color: COLORS.TEXT_LIGHT,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    marginBottom: 4,
    lineHeight: 16,
  },
  newRoundButton: {
    backgroundColor: COLORS.CARD_BG,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.TEXT_MUTED,
  },
  newRoundText: {
    color: COLORS.TEXT_LIGHT,
    fontSize: 13,
    fontWeight: 'bold',
  },
});