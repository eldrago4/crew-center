// src/hooks/useApplicationProcess.js
'use client';

import { useReducer, useCallback, useEffect } from 'react';

// Static data for the test questions.
const questions = [
    { id: 1, question: 'What is the standard traffic pattern altitude (TPA) for most airports in feet?', options: ['800ft AGL', '1000ft AGL', '1200ft AGL', '1500ft AGL'], correctAnswer: 1 },
    { id: 2, question: 'True or False: When ATC is not active, you report your position on every part of the pattern you come across.', options: ['True', 'False'], correctAnswer: 0 },
    { id: 3, question: 'When do you FIRST turn on strobe and landing lights?', options: ['Before takeoff', 'After takeoff', 'When entering the runway', 'When airborne'], correctAnswer: 0 },
    { id: 4, question: 'How do you figure out if you need to fly at an even or odd cruising altitude in Instrument Flight Rules (IFR) - Reduced Vertical Separation Minimum (RVSM) Airspace?', options: ['Based on magnetic heading', 'Based on GPS track', 'Based on filed flight plan', 'Based on ATC instruction'], correctAnswer: 0 },
    { id: 5, question: 'What is the Instrument Flight Rules (IFR) separation minima vertically and laterally respectively?', options: ['500ft and 3NM', '500ft and 2NM', '1000ft and 2NM', '1000ft and 3NM'], correctAnswer: 3 },
    { id: 6, question: 'Fighter Aircraft must not exceed what speed below FL100 and under ATC control.', options: ['250 KIAS', '300 KIAS', '350 KIAS', '400 KIAS'], correctAnswer: 0 },
    { id: 7, question: 'How do you tune to the ILS according to the manual?', options: ['Manual tuning', 'GPS approach', 'VOR approach', 'Using NAV1 frequency'], correctAnswer: 3 },
    { id: 8, question: 'Is visual approach an IFR or VFR approach?', options: ['IFR', 'VFR', 'Both', 'Neither'], correctAnswer: 0 },
    { id: 9, question: '1500-3000 fpm V/S is usually considered safe.', options: ['True', 'False'], correctAnswer: 1 },
    { id: 10, question: 'How do you automatically follow a filed flight plan laterally?', options: ['LNAV', 'VNAV', 'APPR', 'FLC'], correctAnswer: 0 },
];

// Defines the initial state for the application.
const initialState = {
    step: 1,
    status: 'idle', // 'idle', 'submitting', 'error'
    error: null,
    isBlocked: false,
    formData: { firstName: '', lastName: '', ifcUsername: '', email: '', reason: '' },
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
                body: JSON.stringify({ type: 'SUBMIT_TEST', payload: { score, passed, applicantInfo: state.formData } }),
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

    return { state, questions, handleInputChange, handleAnswerChange, handleApplicationSubmit, handleTestSubmit, resetApplication, dismissError };
}
