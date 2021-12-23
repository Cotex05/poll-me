import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, Alert, ToastAndroid, ActivityIndicator, ScrollView, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Icon, Button, Overlay, Divider, Input } from 'react-native-elements';
import * as Animatable from 'react-native-animatable';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import { auth, db, storage } from '../firebase';
import PollCard from '../Components/PollCard';

const ProfileScreen = ({ navigation }) => {

    const [waitDisp, setWaitDisp] = useState('none');

    const userProfile = auth.currentUser;
    const [about, setAbout] = useState("");
    const [image, setImage] = useState(userProfile.photoURL);
    const [uploading, setUploading] = useState(false);
    const [profileImageVisible, setProfileImageVisible] = useState(0);
    const [visible, setVisible] = useState(false);
    const [uploadFromVisible, setUploadFromVisible] = useState(false);

    const [profileImageShow, setProfileImageShow] = useState(false);

    const [data, setData] = useState([]);
    const [userData, setUserData] = useState([]);
    const [userStats, setUserStats] = useState([]);

    const [showPosts, setShowPosts] = useState(false);
    const [refresh, setRefresh] = useState(false);
    const [updating, setUpdating] = useState(false);

    var opt = '';

    const askForPermission = async () => {
        const cameraPermissionResult = await Camera.requestPermissionsAsync();
        const imageLibraryPermissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (cameraPermissionResult.granted === false || imageLibraryPermissionResult.granted === false) {
            Alert.alert('Need Permissions!',
                "Please allow the app, to access Camera and Storage.",
                [
                    {
                        text: "Cancel",
                        onPress: () => console.log("Cancel Pressed"),
                    },
                    { text: "Ok", onPress: () => askForPermission() }
                ])
            return false;
        }
        return true;
    };

    const selectCameraOption = () => {
        opt = 'camera';
        uploadHandler();
        setUploadFromVisible(false);
    };

    const selectGalleryOption = () => {
        opt = 'gallery';
        uploadHandler();
        setUploadFromVisible(false);
    };

    const UploadFromOptions = () => {
        if (opt === 'camera') {
            return 'camera';
        }
        if (opt === 'gallery') {
            return 'gallery';
        } else {
            return null;
        }
    };

    const uploadHandler = async () => {

        const hasPermission = await askForPermission()
        if (!hasPermission) {
            return;
        } else {
            const option = UploadFromOptions();
            var selector = null;

            //gallery option
            if (option === 'gallery') {
                selector = ImagePicker.launchImageLibraryAsync;
            }
            // camera option
            else if (option === 'camera') {
                selector = ImagePicker.launchCameraAsync;
            }
            else {
                return;
            }
            selector({
                mediaTypes: "Images",
                allowsEditing: true,
                aspect: [4, 4],
                quality: 1,
            }).then((result) => {
                if (!result.cancelled) {
                    // User picked an image
                    const { height, width, type, uri } = result;
                    setImage(uri);
                    return uriToBlob(uri);
                } else {
                    return;
                }
            }).then((blob) => {
                if (blob != undefined) {
                    return uploadToFirebase(blob);
                } else {
                    return;
                }
            }).then((snapshot) => {
                if (snapshot != undefined) {
                    // console.log("Uploaded Successfully!");
                    ToastAndroid.showWithGravity(
                        "Profile Picture Updated!",
                        ToastAndroid.SHORT,
                        ToastAndroid.CENTER
                    );
                    setVisible(false);
                } else {
                    return;
                }
            }).catch((error) => {
                Alert.alert("An Error Occurred!", error.message);
                return;
            });
        }
    };


    const uriToBlob = (uri) => {

        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onload = function () {
                // return the blob
                resolve(xhr.response);
            };
            xhr.onerror = function () {
                // something went wrong
                reject(new Error('uriToBlob failed'));
            };
            // this helps us get a blob
            xhr.responseType = 'blob';
            xhr.open('GET', uri, true);
            xhr.send(null);
        });
    };

    const uploadToFirebase = (blob) => {

        return new Promise((resolve, reject) => {

            var storageRef = storage.ref();

            setVisible(true);

            storageRef.child('profiles/' + userProfile.email + '.jpg').put(blob, {
                contentType: 'image/jpeg'
            }).then((snapshot) => {
                snapshot.ref.getDownloadURL().then((url) => {
                    setUploading(true);
                    userProfile.updateProfile({
                        photoURL: url
                    });
                    //Updating user profile in firestore
                    db.collection('user').doc(userProfile.email).update({
                        profileImage: url,
                    });
                });
                blob.close();
                resolve(snapshot);
                return;

            }).catch((error) => {
                setUploading(false);
                Alert.alert("Error!", error.message);
                reject(error);
            });
        });
    };

    // post fetching
    useEffect(() => {
        const unsubscribe = db.collection('polls').where('ownerUid', '==', userProfile?.uid).onSnapshot(snapshot =>
            setData(snapshot.docs.map(doc => ({
                id: doc.id,
                data: doc.data(),
            }))
            )
        );
        data.sort(function (a, b) {
            return new Date(b.data?.timestamp?.toDate()) - new Date(a.data?.timestamp?.toDate().toString());
        });
        setTimeout(() => {
            setShowPosts(true);
        }, 1000);
        return (() => {
            unsubscribe();
        })
    }, [refresh]);

    // Profile details fetching
    useEffect(() => {
        const unsubscribe = db.collection("userDetails").doc(userProfile.email).get().then((doc) => {
            setUserStats(doc.data());
            setAbout(doc.data().about);
        }).catch((error) => {
            console.log("Error getting document details:", error);
        });
        const unsubscribe2 = db.collection("user").doc(userProfile.email).get().then((doc) => {
            if (doc.exists) {
                setUserData(doc.data());
                setWaitDisp('flex');
            } else {
                // doc.data() will be undefined in this case
                console.log("No such document!");
            }
        }).catch((error) => {
            console.log("Error getting document:", error);
        });

        return (() => {
            unsubscribe;
            unsubscribe2;
        })
    }, [])

    const refreshPosts = () => {
        setRefresh(!refresh);
        ToastAndroid.showWithGravity(
            "Refreshing...",
            ToastAndroid.SHORT,
            ToastAndroid.CENTER
        );
    }

    const [boxView, setBoxView] = useState(false);

    const boxClose = () => {
        setBoxView(false);
    };

    const updateAbout = () => {
        setUpdating(true);
        userStats.about = about;
        db.collection("userDetails").doc(userProfile.email).update(userStats).then(() => {
            // console.log(userStats)
            setTimeout(() => {
                setUpdating(false);
                setBoxView(false);
            }, 1000);
        });
    }

    const handleAboutUpdate = () => {
        setBoxView(true);
    }

    return (
        <ScrollView style={{ backgroundColor: '#123' }}>
            <View style={{ display: waitDisp }}>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-start' }}>
                    <View>
                        <TouchableOpacity activeOpacity={0.8} onPress={() => setProfileImageShow(true)}>
                            <Animatable.Image
                                useNativeDriver={true}
                                animation='zoomIn'
                                easing="linear"
                                delay={1500}
                                duration={800}
                                iterationCount={1}
                                style={[styles.profileImage, { opacity: profileImageVisible }]}
                                source={{ uri: image }}
                                onLoadEnd={() => setProfileImageVisible(1)}
                            />
                        </TouchableOpacity>
                        <Overlay overlayStyle={{ backgroundColor: "rgba(0,0,0,0.8)" }} isVisible={profileImageShow} onBackdropPress={() => setProfileImageShow(false)}>
                            <View>
                                <Animatable.Image
                                    useNativeDriver={true}
                                    animation='zoomIn'
                                    easing="ease"
                                    duration={200}
                                    iterationCount={1}
                                    style={{ height: 400, width: 400 }}
                                    source={{ uri: image }}
                                    onLoadEnd={() => setProfileImageVisible(1)}

                                />
                            </View>
                        </Overlay>
                        <TouchableOpacity style={styles.uploadPhoto} onPress={() => setUploadFromVisible(true)}>
                            <Icon reverse name="add-a-photo" size={15} type="material-icon" color="#007fff" />
                        </TouchableOpacity>

                        {/* Uploading Indicator */}

                        <Overlay isVisible={visible} onBackdropPress={() => setVisible(false)}>
                            <Text style={{ color: 'grey', fontSize: 20, padding: 12 }}>Uploading...</Text>
                            <ActivityIndicator size="large" color="#007fff" />
                        </Overlay>

                        {/* Uploading from options i.e. Camera or Gallery */}

                        <Overlay isVisible={uploadFromVisible} onBackdropPress={() => setUploadFromVisible(false)}>
                            <View style={{ padding: 15 }}>
                                <Button
                                    title=" Camera"
                                    icon={
                                        <Icon
                                            name="camera-alt"
                                            size={20}
                                            type="material-icon"
                                            color="white"
                                        />
                                    }
                                    containerStyle={{ margin: 10, width: 200 }}
                                    onPress={selectCameraOption}
                                />
                                <Button
                                    title=" Gallery"
                                    icon={
                                        <Icon
                                            name="photo-library"
                                            size={20}
                                            type="material-icon"
                                            color="white"
                                        />
                                    }
                                    containerStyle={{ margin: 10, width: 200 }}
                                    onPress={selectGalleryOption}
                                />
                            </View>
                        </Overlay>
                    </View>
                    <View>
                        <View style={{ flexDirection: 'row', marginTop: 40, justifyContent: 'space-between' }}>
                            <View style={{ marginRight: 10 }}>
                                <Text style={styles.itemHead}>Posts</Text>
                                <Text style={styles.itemDesc}>{userStats.postsCount}</Text>
                            </View>
                            <View style={{ marginRight: 10 }}>
                                <Text style={styles.itemHead}>Followers</Text>
                                <Text style={styles.itemDesc}>{userStats.followersCount}</Text>
                            </View>
                            <View style={{ marginRight: 10 }}>
                                <Text style={styles.itemHead}>Followings</Text>
                                <Text style={styles.itemDesc}>{userStats.followingsCount}</Text>
                            </View>
                        </View>
                    </View>
                </View>
                <View>
                    <View style={styles.profileObjects}>
                        <View style={styles.detailsView}>
                            <Text style={styles.profileName}>{userProfile.displayName.toUpperCase()}</Text>
                            <Text style={{ fontFamily: 'monospace', fontSize: 15, color: 'limegreen', padding: 5 }}>@{userData.handle}</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Text style={{ fontSize: 15, color: 'gray', padding: 5 }}>{userStats.about}</Text>
                                <TouchableOpacity onPress={handleAboutUpdate}>
                                    <Icon name='pencil-outline' type='material-community' color="#fff" size={22} />
                                </TouchableOpacity>
                            </View>
                            {/* Overlay Input for about */}
                            <Overlay overlayStyle={{ backgroundColor: '#000', borderRadius: 20 }} isVisible={boxView} onBackdropPress={boxClose}>
                                <View style={{ width: 350, backgroundColor: '#000', borderRadius: 20 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                        <Text style={{ color: '#fff', fontSize: 20, padding: 12 }}>Edit About</Text>
                                        <Icon onPress={boxClose} containerStyle={{ padding: 12 }} size={30} name="cancel" color="red" />
                                    </View>
                                    <KeyboardAvoidingView behavior='padding' keyboardVerticalOffset={20}>
                                        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                                            <View>
                                                <Input
                                                    placeholder="  Add a bio"
                                                    autoCorrect={false}
                                                    autoFocus
                                                    type="text"
                                                    value={about}
                                                    onChangeText={text => setAbout(text)}
                                                    maxLength={100}
                                                    multiline
                                                    inputStyle={{ color: '#eef' }}
                                                    leftIcon={
                                                        <Icon
                                                            name='speaker-notes'
                                                            type='material-icon'
                                                            size={24}
                                                            color='#eee'
                                                        />
                                                    }
                                                />
                                                {updating ? <ActivityIndicator size="large" color="#007fff" /> : <Button onPress={updateAbout} title="Update" type="clear" />}
                                            </View>
                                        </TouchableWithoutFeedback>
                                    </KeyboardAvoidingView>
                                </View>
                            </Overlay>
                        </View>
                    </View>
                    {userProfile.uid != userProfile.uid ? <View>
                        <Button type='outline' title="Follow" buttonStyle={{ width: '80%', margin: 12, alignSelf: 'center' }} />
                    </View> : null}
                </View>
                <View style={{ backgroundColor: '#123' }}>
                    <Divider
                        orientation="horizontal"
                        width={2}
                    />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: 'ghostwhite', fontFamily: 'serif', fontWeight: 'bold', fontSize: 20, padding: 12 }}>Recent Posts</Text>
                        <TouchableOpacity style={{ margin: 12 }} onPress={refreshPosts}>
                            <Icon name='refresh' type='ionicons' color="#fff" size={30} />
                        </TouchableOpacity>
                    </View>
                    <View>
                        {showPosts ? data.slice(0).reverse().map((item) => (
                            <PollCard
                                key={item.id}
                                postId={item.id}
                                date={item?.data?.timestamp?.toDate().toString().slice(4, 10)}
                                profileImage={userProfile.photoURL}
                                options={item.data.options}
                                ownerUid={item.data.ownerUid}
                                name={item.data.ownerName}
                                question={item.data.question}
                                votes={item.data.votes}
                                upvotes={item.data.upvotes}
                                navi={navigation}
                            />
                        )) : <ActivityIndicator size="large" color="limegreen" />}
                    </View>
                    <View style={{ height: 200 }} />
                </View>
            </View>
        </ScrollView>
    )
}

export default ProfileScreen;

const styles = StyleSheet.create({
    profileImage: {
        height: 100,
        width: Dimensions.get('window').width,
        aspectRatio: 1,
        resizeMode: 'cover',
        borderColor: '#fff',
        borderWidth: 1,
        alignSelf: 'flex-start',
        borderRadius: 300,
        marginHorizontal: 25,
        marginTop: 20
    },
    profileName: {
        color: "#fff",
        fontSize: 18,
        paddingLeft: 5,
        alignSelf: 'flex-start',
        fontFamily: 'serif',
    },
    uploadPhoto: {
        position: 'absolute',
        bottom: -10,
        left: Dimensions.get('window').width / 2 - Dimensions.get('window').width / 3.5,
    },
    profileObjects: {
        padding: 5,
        width: "95%",
        alignSelf: 'center',
        marginVertical: 12,
    },
    detailsView: {
        padding: 15,
        borderRadius: 15,
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    email: {
        color: 'grey',
        fontFamily: 'serif',
        fontWeight: 'bold',
        fontSize: 15,
        letterSpacing: 1,
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        letterSpacing: -0.5
    },
    itemHead: {
        color: '#fff',
        fontSize: 17,
    },
    itemDesc: {
        fontFamily: 'monospace',
        color: '#fff',
        fontSize: 16,
        alignSelf: 'center',
        fontWeight: 'bold'
    }
})
