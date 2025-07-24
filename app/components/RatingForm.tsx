import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

const RatingForm = ({ buffetID, onSubmit }) => {
    const [ratingValue, setRatingValue] = useState(5);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        setSubmitting(true);
        await onSubmit({ rating: ratingValue, comment, buffetID });
        setComment("");
        setRatingValue(5);
        setSubmitting(false);
    };

    return (
        <View style={styles.formContainer}>
            <Text>Your Rating:</Text>
            <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(ratingValue)}
                onChangeText={val => {
                    const num = parseInt(val || 0, 10);
                    if (num >= 1 && num <= 5) setRatingValue(num);
                }}
            />
            <Text>Comment:</Text>
            <TextInput
                style={styles.input}
                value={comment}
                onChangeText={setComment}
                multiline
            />
            <TouchableOpacity
                style={styles.button}
                onPress={handleSubmit}
                disabled={submitting || !comment.trim()}
            >
                <Text>{submitting ? "Submitting..." : "Submit"}</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    formContainer: { margin: 16 },
    input: { borderWidth: 1, borderColor: "#ccc", marginBottom: 8, padding: 8 },
    button: { backgroundColor: "#2196F3", padding: 10 },
});

export default RatingForm;
