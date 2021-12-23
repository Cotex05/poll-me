import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TouchableNativeFeedback, ToastAndroid, Modal, Pressable, Dimensions, ActivityIndicator } from 'react-native';
import { Avatar, Button, Icon, LinearProgress, Overlay } from 'react-native-elements';
import { auth, db } from '../firebase';

const PollCard = (props) => {

    const [arrowColor, setArrowColor] = useState('white');
    const [selectedOption, setSelectedOption] = useState(null);
    const [pollOpacity, setPollOpacity] = useState(0);
    const [modalVisible, setModalVisible] = useState(false);
    const [visible, setVisible] = useState(false);
    const [userData, setUserData] = useState([]);

    var postData;
    const uid = auth.currentUser?.uid;
    const postId = props.postId;

    useEffect(() => {
        const unsubscribe = db.collection('polls').doc(postId).collection('polledUsers').doc(uid).get().then((doc) => {
            const data = doc.data();
            if (data != undefined) {
                if (data.upvoted == true) {
                    setArrowColor('lime');
                }
                if (data.polled == true) {
                    setPollOpacity(1);
                    setSelectedOption(data.selectedOption);
                }
            }
        });
        const unsubscribe2 = db.collection('polls').doc(postId).get().then(doc => {
            const data = doc.data();
            setUserData(data);
        });
        return (() => {
            unsubscribe;
            unsubscribe2;
        })
    }, []);

    const handleUpvote = () => {
        if (arrowColor == 'white') {
            setArrowColor('lime');
            db.collection('polls').doc(postId).collection('polledUsers').doc(uid).set({
                upvoted: true,
            }, { merge: true }).then(() => {
                console.log("Upvoted!");
            })
                .catch((error) => {
                    console.error("Error: ", error.message);
                });
            db.collection('polls').doc(postId).get().then((doc) => {
                postData = doc.data();
            }).then(() => {
                postData.upvotes++;
            }).then(() => {
                db.collection('polls').doc(postId).set(postData);
            });
        } else {
            setArrowColor('white');
            db.collection('polls').doc(postId).collection('polledUsers').doc(uid).set({
                upvoted: false,
            }, { merge: true }).then(() => {
                console.log("Downvoted!");
            }).catch((error) => {
                console.error("Error: ", error.message);
            });
            db.collection('polls').doc(postId).get().then((doc) => {
                postData = doc.data();
            }).then(() => {
                postData.upvotes--;
            }).then(() => {
                db.collection('polls').doc(postId).set(postData);
            });
        }
    }

    const options = props.options;

    const handleOptions = (id) => {
        if (selectedOption == null) {
            setPollOpacity(1);
            setSelectedOption(id);
            db.collection('polls').doc(postId).collection('polledUsers').doc(uid).set({
                polled: true,
                selectedOption: id
            }, { merge: true }).then(() => {
                console.log("Polled!");
            }).catch((error) => {
                console.error("Error: ", error.message);
            });
            db.collection('polls').doc(postId).get().then(doc => {
                postData = doc.data();
            }).then(() => {
                postData.options.map((item, index) => {
                    if (id == index) {
                        item.score = ((Math.round((item.score * postData.votes).toFixed(2)) + 1) / (postData.votes + 1)).toFixed(2);
                    } else {
                        item.score = (Math.round((item.score * postData.votes).toFixed(2)) / (postData.votes + 1)).toFixed(2);
                    }
                });
                postData.votes++;
                // console.log(postData);
            }).then(() => {
                db.collection('polls').doc(postId).set(postData);
            });
        } else {
            ToastAndroid.showWithGravity(
                "Already Voted!",
                ToastAndroid.SHORT,
                ToastAndroid.CENTER
            );
        }
    }


    const handlePostDelete = async () => {
        setVisible(true);
        const unsubscribe = await db.collection("polls").doc(postId).delete().then(() => {
            setModalVisible(false);
            setTimeout(() => {
                ToastAndroid.showWithGravity(
                    "Post Deleted!",
                    ToastAndroid.SHORT,
                    ToastAndroid.CENTER
                );
                setVisible(false);
            }, 2000)
            console.log(`Post: ${postId} successfully deleted!`);
        }).catch((error) => {
            console.error("Error removing document: ", error);
        });
        return (() => {
            unsubscribe;
        });
    };

    const handleModal = () => {
        setModalVisible(!modalVisible);
    }

    const handleProfileNavigation = () => {
        if (userData.ownerUid == uid) {
            props.navi.navigate("Main", { screen: "Profile" });
        } else {
            props.navi.navigate("UserProfile", { data: userData });
        }
    }

    return (
        <View style={{ justifyContent: 'center', alignSelf: 'center', width: '98%', marginVertical: 10 }}>
            <View style={{ borderRadius: 12, backgroundColor: "rgba(0,150,250,0.2)", borderColor: 'rgba(0,0,0,0)', paddingHorizontal: 7 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <TouchableOpacity onPress={handleProfileNavigation} activeOpacity={0.7} style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', margin: 2 }}>
                        <Avatar
                            rounded
                            source={{
                                uri: props.profileImage,
                            }}
                            size={40}
                        />
                        <Text style={{ fontSize: 16, fontFamily: 'serif', fontWeight: 'bold', padding: 5, color: '#ffe', marginVertical: 12 }}>{props.name}</Text>
                    </TouchableOpacity>
                    <View>
                        <TouchableOpacity style={{ paddingVertical: 8 }} activeOpacity={0.7} onPress={handleModal}>
                            <Icon name="dots-three-vertical" type="entypo" size={25} color="gray" />
                        </TouchableOpacity>
                        <View style={styles.centeredView}>
                            <Modal
                                animationType="slide"
                                transparent={true}
                                visible={modalVisible}
                                onRequestClose={() => {
                                    setModalVisible(!modalVisible);
                                }}
                            >
                                <View style={styles.modalView}>
                                    <View style={{ height: 5, backgroundColor: 'gray', width: 150, borderRadius: 50, marginBottom: 20 }} />
                                    {props.ownerUid == uid ? (<TouchableOpacity activeOpacity={0.7} onPress={handlePostDelete}>
                                        <View style={styles.options}>
                                            <Icon name="delete" size={25} type="material-icons" color="red" />
                                            <Text style={[styles.BtnTxt, { color: 'red' }]}>Delete</Text>
                                        </View>
                                    </TouchableOpacity>) : null}
                                    <TouchableOpacity activeOpacity={0.7} onPress={() => setModalVisible(!modalVisible)}>
                                        <View style={styles.options}>
                                            <Icon name="error" size={25} type="material-icons" color="#007fff" />
                                            <Text style={styles.BtnTxt}>Report</Text>
                                        </View>
                                    </TouchableOpacity>
                                    <TouchableOpacity activeOpacity={0.7} onPress={() => setModalVisible(!modalVisible)}>
                                        <View style={styles.options}>
                                            <Icon name="close" size={25} type="ionicon" color="#007fff" />
                                            <Text style={styles.BtnTxt}>Close</Text>
                                        </View>
                                    </TouchableOpacity>
                                    <View style={{ height: 400 }} />
                                </View>
                            </Modal>
                        </View>
                        <Overlay isVisible={visible} onBackdropPress={() => setVisible(false)}>
                            <Text style={{ color: 'gray', fontSize: 20, padding: 12, fontWeight: 'bold' }}>Deleting...</Text>
                            <ActivityIndicator size="large" color="red" />
                        </Overlay>
                    </View>
                </View>
                <Text style={{ margin: 5, fontFamily: 'monospace', color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                    {props.question}
                </Text>
                <View>
                    {options.map((opts, id) => {
                        {/* console.log(opts.score); */ }
                        return (
                            <TouchableOpacity key={id} onPress={() => handleOptions(id)} activeOpacity={0.7} style={{ flexDirection: 'column', justifyContent: 'flex-start', borderColor: (id !== selectedOption ? 'rgba(250,250,250,0.2)' : 'rgba(0,150,255,1)'), borderWidth: 1, padding: 5, borderRadius: 15, marginVertical: 5 }}>
                                <LinearProgress variant='determinate' value={Number(opts.score)} color={(id !== selectedOption ? 'rgba(0,0,0,0.45)' : 'rgba(0,150,255,0.9)')} style={{ height: 28, borderRadius: 8, opacity: pollOpacity }} />
                                <View style={{ position: 'absolute', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Text style={{ color: '#fff', fontSize: 16, margin: 2, left: 12, top: 3, width: '85%' }}>{opts.opt}</Text>
                                    <Text style={{ color: '#fff', alignSelf: 'center', fontSize: 14, margin: 2, left: 12, top: 5, opacity: pollOpacity }}>{Math.round(Number(opts.score).toFixed(2) * 100)}%</Text>
                                </View>
                            </TouchableOpacity>
                        )
                    })}
                </View>
                <View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center' }}>
                            <Button
                                buttonStyle={{ width: 50, height: 50, borderRadius: 100 }}
                                type="clear"
                                TouchableComponent={prop => {
                                    return (
                                        <TouchableNativeFeedback background={TouchableNativeFeedback.Ripple("lime", true, 25)}>
                                            {prop.children}
                                        </TouchableNativeFeedback>
                                    )
                                }}
                                icon={
                                    <Icon
                                        name="arrow-up"
                                        type="ionicon"
                                        size={30}
                                        color={arrowColor}
                                        onPress={handleUpvote}
                                    />
                                }
                            />
                            <Text style={{ color: 'lime', marginLeft: -5 }}>{props.upvotes}</Text>
                        </View>
                        <View>
                            <Text style={{ color: 'white', fontWeight: 'bold' }}>{props.votes} Votes</Text>
                            <Text style={{ color: 'rgb(150,150,150)', fontSize: 12, alignSelf: 'flex-end' }}>{props.date}</Text>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    )
}

export default PollCard;

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginTop: 12,
        width: '100%'
    },
    modalView: {
        backgroundColor: "#000",
        borderTopRightRadius: 15,
        borderTopLeftRadius: 15,
        padding: 15,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        marginTop: Dimensions.get('window').height / 1.8
    },
    options: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        marginHorizontal: 15
    },
    BtnTxt: {
        fontSize: 18,
        fontWeight: 'bold',
        padding: 12,
        color: '#007fff'
    },
})
