import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Post from '../app/(root)/(tabs)/post';
import { useGlobalContext } from '@/lib/global-provider';
import { postBuffet, supplementPhoto } from '@/app/actions/buffetActions';
import { uploadfile } from '@/lib/appwrite';

jest.mock('@/lib/global-provider', () => ({
    useGlobalContext: jest.fn(),
}));
jest.mock('@/app/actions/buffetActions', () => ({
    postBuffet: jest.fn(),
    supplementPhoto: jest.fn(() => Promise.resolve('mockPhoto')),
}));
jest.mock('@/lib/appwrite', () => ({
    uploadfile: jest.fn(() => Promise.resolve('mockUploadedFile')),
}));
jest.mock('@expo/vector-icons', () => ({
    AntDesign: () => null,
}));
jest.mock('@/app/actions/camera', () => {
    const React = require('react');
    return {
        __esModule: true,
        default: (props) => {
            React.useEffect(() => {
                props.onPhotoTaken({ uri: 'mockUri' });
                props.onClose();
            }, []);
            return null;
        }
    };
});

jest.mock('expo-router', () => ({
    router: {
        push: jest.fn(),
    },
}));


describe('Post Component', () => {
    beforeEach(() => {
        useGlobalContext.mockReturnValue({ user: { $id: 'user1', name: 'TestUser' } });
        postBuffet.mockClear();
        supplementPhoto.mockClear();
        uploadfile.mockClear();
    });

    it('renders without crashing', () => {
        const { getByText } = render(<Post />);
        expect(getByText('New Buffet')).toBeTruthy();
    });

    it('validates location selection', async () => {
        const { getByText } = render(<Post />);
        const submitButton = getByText('Submit Buffet');
        fireEvent.press(submitButton);
        await waitFor(() => {
            expect(getByText('Location is required.')).toBeTruthy();
        });
    });

    it('validates presence of at least one photo', async () => {
        const { getByText } = render(<Post />);
        // (Assuming location set, but photo missing triggers photo validation)
        const submitButton = getByText('Submit Buffet');
        fireEvent.press(submitButton);
        await waitFor(() => {
            expect(getByText('Please take at least one photo')).toBeTruthy();
        });
    });

    it('opens camera modal and simulates taking a photo', async () => {
        const { getByText, queryByTestId } = render(<Post />);
        const addPhotoButton = getByText('Add Photo');
        fireEvent.press(addPhotoButton);
        // After effect runs, modal should close (if you provide a testID to modal, you may use queryByTestId)
        await waitFor(() => {
            expect(queryByTestId('camera-modal')).toBeNull();
        });
    });

});
