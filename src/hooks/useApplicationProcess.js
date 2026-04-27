// src/hooks/useApplicationProcess.js
'use client';

import { useReducer, useCallback, useEffect } from 'react';

// Shuffle function to select random questions
function getRandomQuestions(allQuestions, count) {
    const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);
    return selected.map((q, index) => ({ ...q, id: index + 1 }));
}

// Static data for the test questions.
const allQuestions = [
    { question: 'What is the standard traffic pattern altitude (TPA) for most airports in feet?', options: ['800ft AAL', '1000ft AAL', '1200ft AAL', '1500ft AAL'], correctAnswer: 1 },
    { question: 'When ATC is not active, you report your position on every part of the pattern you come across.', options: ['True', 'False'], correctAnswer: 0 },
    { question: 'When do you FIRST turn on strobe and landing lights?', options: ['Before takeoff', 'After takeoff', 'When entering the runway', 'When airborne'], correctAnswer: 0 },
    { question: 'How do you figure out if you need to fly at an even or odd cruising altitude in Instrument Flight Rules (IFR) - Reduced Vertical Separation Minimum (RVSM) Airspace?', options: ['Based on magnetic heading', 'Based on GPS track', 'Based on filed flight plan', 'Based on ATC instruction'], correctAnswer: 0 },
    { question: 'What is the Instrument Flight Rules (IFR) separation minima vertically and laterally respectively?', options: ['500ft and 3NM', '500ft and 2NM', '1000ft and 2NM', '1000ft and 3NM'], correctAnswer: 3 },
    { question: 'Fighter Aircraft must not exceed what speed below FL100 and under ATC control.', options: ['250 KIAS', '300 KIAS', '350 KIAS', '400 KIAS'], correctAnswer: 0 },
    { question: 'How do you tune to the ILS according to the manual?', options: ['Manual tuning', 'GPS approach', 'VOR approach', 'Using NAV1 frequency'], correctAnswer: 3 },
    { question: 'Is visual approach an IFR or VFR approach?', options: ['IFR', 'VFR', 'Both', 'Neither'], correctAnswer: 0 },
    { question: '1500-3000 fpm V/S is usually considered safe.', options: ['True', 'False'], correctAnswer: 1 },
    { question: 'How do you automatically follow a filed flight plan laterally?', options: ['LNAV', 'VNAV', 'APPR', 'FLC'], correctAnswer: 0 },
    { question: 'The use of Check In is for aircraft flying ____.', options: ['on a filed IFR flight plan', 'VFR', 'in formation', 'only with center control'], correctAnswer: 0 },
    { question: 'A standard rate turn equals how many degrees per second?', options: ['1°', '2°', '3°', '5°'], correctAnswer: 2 },
    { question: 'After landing, what must you do before contacting Ground for taxi?', options: ['Request taxi first, then exit runway', 'Clear the runway completely', 'Come to a full stop', 'Tune to Ground immediately'], correctAnswer: 1 },
    { question: 'If cleared for an ILS approach by Radar, which option should you send to Tower?', options: ['Send', 'Request Specific Runway', 'On the ILS', 'On the GPS'], correctAnswer: 2 },
    { question: 'Commercial jets typically cruise at:', options: ['10,000–15,000 feet', '20,000–25,000 feet', '30,000–40,000 feet', '45,000–55,000 feet'], correctAnswer: 2 },
    { question: 'Ground speed is different from indicated airspeed because:', options: ['Ground speed includes the effect of wind', 'Ground speed is always lower than IAS', 'Ground speed ignores altitude', 'Ground speed is read from the pitot tube'], correctAnswer: 0 },
    { question: 'The main function of flaps is:', options: ['Increase thrust at takeoff', 'Reduce drag at cruise', 'Increase lift at lower speeds', 'Stabilize during turbulence'], correctAnswer: 2 },
    { question: 'What is the purpose of spoilers on a wing?', options: ['Increase lift', 'Reduce drag', 'Destroy lift and help in descent/landing', 'Improve stability at high speeds'], correctAnswer: 2 },
    { question: 'What does the APPR (Approach) mode in autopilot do?', options: ['Maintains heading only', 'Locks onto ILS localizer and glide slope for automatic landing guidance', 'Increases climb rate', 'Sets flaps automatically'], correctAnswer: 1 },
    { question: 'You are approaching VABB and you are on right downwind for runway 27 What will be your downwind heading?', options: ['270°', '90°', '27°', '180°'], correctAnswer: 1 },
    { question: 'You are ready to take off from VABB on runway 27 and ATC gives you straight out departure instead of your filed NORTH departure. What should you do?', options: ['Follow the FPL', 'Maintain runway heading', 'Maintain 270°', 'Both B and C'], correctAnswer: 3 },
];

const questions = getRandomQuestions(allQuestions, 10);


// Defines the initial state for the application.
const initialState = {
    step: 1,
    status: 'idle', // 'idle', 'submitting', 'error'
    error: null,
    isBlocked: false,
    formData: { firstName: '', lastName: '', ifcUsername: '', email: '', reason: '' },
    callsign: '',
    answers: {},
    testResult: null,
};

// The reducer function manages all state transitions in a predictable way.
function applicationReducer(state, action) {
    switch (action.type) {
        case 'CHECK_BLOCK_STATUS':
            return {...state, isBlocked: action.payload };
        case 'UPDATE_FORM_FIELD':
            return {...state, formData: {...state.formData, [action.payload.field]: action.payload.value } };
        case 'UPDATE_CALLSIGN':
            return {...state, callsign: action.payload };
        case 'UPDATE_ANSWER':
            return {...state, answers: {...state.answers, [action.payload.questionId]: action.payload.answerIndex } };
        case 'SUBMISSION_START':
            return {...state, status: 'submitting', error: null };
        case 'APPLICATION_SUBMIT_SUCCESS':
            return {...state, status: 'idle', step: 2 };
        case 'TEST_SUBMIT_SUCCESS':
            return {...state, status: 'idle', step: 3, testResult: action.payload, isBlocked: state.isBlocked || !action.payload.passed };
        case 'SUBMISSION_FAILURE':
            return {...state, status: 'error', error: action.payload };
        case 'RESET_APPLICATION':
            return {...initialState, isBlocked: state.isBlocked };
        case 'DISMISS_ERROR':
            return {...state, status: 'idle', error: null };
        default:
            throw new Error(`Unhandled action type: ${action.type}`);
    }
}

// The custom hook that encapsulates all client-side logic.
export function useApplicationProcess() {
    const [state, dispatch] = useReducer(applicationReducer, initialState);

    useEffect(() => {
        const blockData = localStorage.getItem('testBlock');
        if (blockData) {
            const { timestamp } = JSON.parse(blockData);
            const twentyFourHours = 24 * 60 * 60 * 1000;
            if (Date.now() - timestamp < twentyFourHours) {
                dispatch({ type: 'CHECK_BLOCK_STATUS', payload: true });
            } else {
                localStorage.removeItem('testBlock');
                dispatch({ type: 'CHECK_BLOCK_STATUS', payload: false });
            }
        }
    }, []);

    const handleInputChange = useCallback((e) => {
        dispatch({ type: 'UPDATE_FORM_FIELD', payload: { field: e.target.name, value: e.target.value } });
    }, []);

    const handleCallsignChange = useCallback((value) => {
        dispatch({ type: 'UPDATE_CALLSIGN', payload: value });
    }, []);

    const handleAnswerChange = useCallback((questionId, answerIndex) => {
        dispatch({ type: 'UPDATE_ANSWER', payload: { questionId, answerIndex } });
    }, []);

    const handleApplicationSubmit = useCallback(async (e) => {
        e.preventDefault();
        dispatch({ type: 'SUBMISSION_START' });
        try {
            const response = await fetch('/api/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'SUBMIT_APPLICATION', payload: { formData: state.formData } }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'An unknown error occurred.');
            dispatch({ type: 'APPLICATION_SUBMIT_SUCCESS' });
        } catch (error) {
            dispatch({ type: 'SUBMISSION_FAILURE', payload: error.message });
        }
    }, [state.formData]);

    const handleTestSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (Object.keys(state.answers).length < questions.length) {
            dispatch({ type: 'SUBMISSION_FAILURE', payload: 'Please answer all questions before submitting.' });
            return;
        }
        dispatch({ type: 'SUBMISSION_START' });

        let score = 0;
        questions.forEach((q) => {
            if (state.answers[q.id] === q.correctAnswer) score++;
        });
        const passed = score >= 7;
        const testResult = { passed, score };

        try {
            await fetch('/api/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'SUBMIT_TEST', payload: { score, passed, applicantInfo: state.formData, callsign: state.callsign } }),
            });
            if (!passed) {
                localStorage.setItem('testBlock', JSON.stringify({ timestamp: Date.now() }));
            }
            dispatch({ type: 'TEST_SUBMIT_SUCCESS', payload: testResult });
        } catch (error) {
            dispatch({ type: 'SUBMISSION_FAILURE', payload: error.message });
        }
    }, [state.answers, state.formData]);

    const resetApplication = useCallback(() => dispatch({ type: 'RESET_APPLICATION' }), []);
    const dismissError = useCallback(() => dispatch({ type: 'DISMISS_ERROR' }), []);

    return { state, questions, handleInputChange, handleCallsignChange, handleAnswerChange, handleApplicationSubmit, handleTestSubmit, resetApplication, dismissError };
}
