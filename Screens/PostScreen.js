import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, LogBox, ScrollView, StyleSheet, Text, ToastAndroid, TouchableWithoutFeedback, View } from 'react-native'
import { Button, Icon, Input, Overlay } from 'react-native-elements';
import { TouchableOpacity } from 'react-native-gesture-handler';

import * as firebase from 'firebase';
import { auth, db } from '../firebase';

LogBox.ignoreLogs(['Failed prop type']);

const PostScreen = ({ navigation }) => {

    const [height, setHeight] = useState(50);
    const [opts, setOpts] = useState([1])

    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState({ 'option_1': '', 'option_2': '', 'option_3': '', 'option_4': '', 'option_5': '' });
    const [optionCount, setOptionCount] = useState(1);

    const [visible, setVisible] = useState(false);
    const [currentUserStats, setcurrentUserStats] = useState([]);

    const toggleOverlay = () => {
        ToastAndroid.showWithGravity(
            "Cannot Cancel!",
            ToastAndroid.SHORT,
            ToastAndroid.BOTTOM
        );
    };

    useEffect(() => {
        const unsubscribe = db.collection("userDetails").doc(auth.currentUser.email).get().then((doc) => {
            setcurrentUserStats(doc.data());
        }).catch((error) => {
            console.log("Error getting document details:", error);
        });
        return () => {
            unsubscribe;
        }
    }, [])

    // handle functions
    const handleInputHeight = (e) => {
        if (height < 150) {
            setHeight(e.nativeEvent.contentSize.height);
        } else {
            if (e.nativeEvent.contentSize.height < 150) {
                setHeight(e.nativeEvent.contentSize.height);
            } else {
                setHeight(150);
            }
        }
    };

    const handleOptionAdd = () => {
        if (opts.length <= 4) {
            setOpts([...opts, 1]);
            setOptionCount(optionCount + 1);
        } else {
            ToastAndroid.showWithGravity(
                "Max options added!",
                ToastAndroid.SHORT,
                ToastAndroid.BOTTOM
            );
        }
        // console.log(opts);
        // console.log(optionCount);
    }
    const handleOptionDelete = (id) => {
        if (opts.length > 1) {
            setOpts(opts.slice(0, opts.length - 1));
            // console.log("Removed!");

            //handling options values on deletion
            setOptions({ ...options, [`option_${id + 1}`]: '' });
            setOptionCount(optionCount - 1);
        }
        // console.log(optionCount);
    }

    const handleOptionValues = (text, id) => {
        setOptions({ ...options, [`option_${id + 1}`]: text });
    }

    // To firebase
    const handlePost = () => {
        Keyboard.dismiss();
        let opts = [
            { "opt": options.option_1, "score": 0 },
            { "opt": options.option_2, "score": 0 },
            { "opt": options.option_3, "score": 0 },
            { "opt": options.option_4, "score": 0 },
            { "opt": options.option_5, "score": 0 }
        ]
        opts = opts.slice(0, optionCount);
        // console.log(opts);
        const data = {
            options: opts,
            ownerEmail: auth.currentUser?.email,
            ownerName: auth.currentUser?.displayName,
            ownerPhoto: auth.currentUser?.photoURL,
            ownerUid: auth.currentUser?.uid,
            question: question,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            upvotes: 0,
            votes: 0
        };
        if (question.trim().length > 0 && options.option_1.trim().length > 0) {

            //showing uploading animation...
            setVisible(true);

            // To global posts db
            const postingSequence = () => {
                setVisible(false);
                currentUserStats.postsCount++;
                db.collection("userDetails").doc(auth.currentUser.email).update(currentUserStats);
                ToastAndroid.showWithGravity(
                    "Posted Successfully!",
                    ToastAndroid.SHORT,
                    ToastAndroid.CENTER
                );
                navigation.replace("Main");
                // navigation.navigate("Main", {
                //     screen: 'Home',
                //     params: {
                //         screen: 'Home',
                //         param: {
                //             newPost: true
                //         }
                //     }
                // });
            }

            db.collection('polls').add(data).then(() => {
                setTimeout(() => {
                    postingSequence();
                }, 4000);
            }).catch(err => {
                console.log(err.message);
            });
            console.log("Posted!");
        } else {
            Alert.alert("Empty Fields", "Please write something...");
        };
        return;
    }

    return (
        <ScrollView style={styles.container} keyboardShouldPersistTaps={'handled'}>
            <StatusBar style="light" />
            <View>
                <Text style={styles.topHeading}> Create a new poll</Text>
            </View>
            <View style={styles.postFormBox}>
                <KeyboardAvoidingView behavior='padding' keyboardVerticalOffset={20}>
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <>
                            <View style={{ padding: 10 }}>
                                <Input
                                    placeholder='Write your question here...'
                                    label="Question"
                                    inputStyle={{ color: '#eef', fontFamily: 'serif', backgroundColor: 'rgba(255,255,255,0.1)', padding: 5, borderRadius: 10 }}
                                    multiline={true}
                                    value={question}
                                    onChangeText={text => setQuestion(text)}
                                    onContentSizeChange={e => handleInputHeight(e)}
                                    style={{ margin: 5 }}
                                />
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={{ fontSize: 18, color: '#fff', fontWeight: 'bold', marginLeft: 12 }}>Options</Text>
                                    <Button
                                        title=""
                                        type="clear"
                                        buttonStyle={{ width: 50, alignSelf: 'center' }}
                                        onPress={handleOptionAdd}
                                        icon={
                                            <Icon
                                                name="add-circle-outline"
                                                type="ionicons"
                                                size={30}
                                                color="#007fff"
                                            />
                                        }
                                    />
                                </View>
                                <View>
                                    {opts.map((opt, id) => (
                                        <Input
                                            key={id}
                                            style={{ color: '#fff' }}
                                            multiline
                                            maxLength={100}
                                            placeholder={`Option ${id + 1}`}
                                            name={`option_${id + 1}`}
                                            value={options}
                                            onChangeText={text => handleOptionValues(text, id)}
                                            leftIcon={
                                                <Icon
                                                    name='caretright'
                                                    type="ant-design"
                                                    size={24}
                                                    color='#007fff'
                                                />
                                            }
                                            rightIcon={
                                                <TouchableOpacity onPress={() => handleOptionDelete(id)}>
                                                    <Icon
                                                        name='close'
                                                        type="ionicon"
                                                        size={24}
                                                        color='red'
                                                        style={{ display: (id == opts.length - 1 && id != 0 ? 'flex' : 'none') }}
                                                    />
                                                </TouchableOpacity>
                                            }
                                        />
                                    ))}
                                </View>
                                <Button
                                    containerStyle={{ margin: 12, }}
                                    buttonStyle={{ backgroundColor: 'rgba(20,255,100,0.7)' }}
                                    title="Post"
                                    onPress={handlePost}
                                />
                                <Overlay isVisible={visible} onBackdropPress={toggleOverlay}>
                                    <ActivityIndicator size="large" color="#00ff00" />
                                </Overlay>
                            </View>
                        </>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </View>
        </ScrollView>
    )
}

export default PostScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#123',
    },
    topHeading: {
        color: 'limegreen',
        fontFamily: 'serif',
        fontWeight: 'bold',
        fontSize: 22,
        alignSelf: 'center',
        padding: 8,
    },
    postFormBox: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        margin: 12,
        borderRadius: 12
    }
})
