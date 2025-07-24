import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';

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
            <Text style={styles.amountLabel}>Your Rating: {ratingValue}</Text>
            {/* Slider + absolute ticks for 2–4 */}
            <View style={styles.sliderWrapper}>
                <Slider
                    style={styles.slider}
                    minimumValue={1}
                    maximumValue={5}
                    step={1}
                    value={ratingValue}
                    onValueChange={setRatingValue}
                    minimumTrackTintColor="#2196F3"
                    maximumTrackTintColor="#ccc"
                    thumbTintColor="#2196F3"
                />

                {/* ticks at 25%, 50%, 75% */}
                {[2,3,4].map(val => (
                    <View
                        key={val}
                        style={[
                            styles.tick,
                            {
                                position: 'absolute',
                                top: 18,                                 // adjust to center on track
                                left: `${((val - 1) / 4) * 100}%`,      // (val-1)/(5-1) → 25%, 50%, 75%
                            },
                        ]}
                    />
                ))}
            </View>


            {/* labels for ends */}
            <View style={styles.tickLabelContainer}>
                <Text style={styles.tickLabel}>Bad</Text>
                <Text style={styles.tickLabel}>Good</Text>
            </View>

            <Text style={styles.amountLabel}>Comment:</Text>
            <TextInput
                style={styles.input}
                value={comment}
                onChangeText={setComment}
                multiline
                placeholder="Write your thoughts..."
            />

            <TouchableOpacity
                style={[styles.button, (submitting || !comment.trim()) && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={submitting || !comment.trim()}
            >
                <Text style={styles.buttonText}>
                    {submitting ? "Submitting..." : "Submit"}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    formContainer: {
        backgroundColor: '#FFFFFF',  // white background
        margin: 0,
        padding: 14,                 // add some inner spacing
        borderRadius: 12,            // rounded corners
        // Optional: subtle shadow/elevation on iOS & Android
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },

    amountLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#444',
        marginRight: 8,
        marginTop: 10,
    },
    sliderWrapper: {
        position: 'relative',
        width: '100%',
        height: 40,
        marginBottom: 0,
    },
    slider: {
        width: '100%',
        height: 40,
        marginBottom: 4,
    },
    tickOverlay: {
        position: 'absolute',
        top: 18,               // vertically centered on the track
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        pointerEvents: 'none', // so touches still go to the slider
    },
    tickContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginHorizontal: 12,
        marginBottom: 0,
    },
    tick: {
        width: 2,
        height: 8,
        backgroundColor: '#444',
    },
    tickLabelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginHorizontal: 0,
        marginBottom: 0,
    },
    tickLabel: {
        fontSize: 12,
        color: '#444',
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        marginBottom: 16,
        padding: 8,
        borderRadius: 4,
        minHeight: 60,
        textAlignVertical: 'top'
    },
    button: {
        backgroundColor: "#2196F3",
        padding: 12,
        borderRadius: 4,
        alignItems: 'center'
    },
    buttonDisabled: {
        backgroundColor: "#a0c4e8",
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
    },
});

export default RatingForm;
