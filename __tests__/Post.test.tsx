import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Post from '../app/(root)/(tabs)/post'; // adjust path as needed
import { useGlobalContext } from '@/lib/global-provider';

jest.mock('@/lib/global-provider', () => ({
    useGlobalContext: () => ({
        user: { $id: 'user1', name: 'Test User' },
    }),
}));

// expo-router navigation
jest.mock('expo-router', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        back: jest.fn(),
    }),
}));

// camera, actions, and asset modules
jest.mock('@/app/actions/camera', () => () => null);
jest.mock('@/app/actions/buffetActions', () => ({
    postBuffet: jest.fn().mockResolvedValue({}),
    supplementPhoto: jest.fn().mockResolvedValue({ uri: 'fakeuri' }),
}));
jest.mock('@/lib/appwrite', () => ({
    uploadfile: jest.fn().mockResolvedValue({}),
}));
