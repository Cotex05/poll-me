import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Dimensions, ToastAndroid, ActivityIndicator, ScrollView } from 'react-native';
import { Icon, Button, Divider, Overlay } from 'react-native-elements';
import * as Animatable from 'react-native-animatable';
import LottieView from 'lottie-react-native';
import { auth, db } from '../firebase';
import PollCard from '../Components/PollCard';

const UserProfileScreen = ({ navigation, route }) => {

    const userProfile = auth.currentUser;
    const [profileImageVisible, setProfileImageVisible] = useState(0);

    const [profileImageShow, setProfileImageShow] = useState(false);

    const [waitDisp, setWaitDisp] = useState({ loading: 'flex', content: 'none' });

    const [data, setData] = useState([]);
    const [userData, setUserData] = useState([]);

    const [showPosts, setShowPosts] = useState(false);

    //Follow Button
    const [follow, setFollow] = useState({ text: "Follow", outline: "solid", following: false });

    const [userStats, setUserStats] = useState([]);
    const [currentUserStats, setcurrentUserStats] = useState([]);
    const [visible, setVisible] = useState(false);

    const toggleOverlay = () => {
        ToastAndroid.showWithGravity(
            "Wait!",
            ToastAndroid.SHORT,
            ToastAndroid.CENTER
        );
    };

    // post fetching
    useEffect(() => {
        navigation.setOptions({
            title: (route.params?.data?.ownerName != undefined) ? (route.params?.data?.ownerName) : (route.params.data.username)
        })
        const unsubscribe = db.collection('polls').where('ownerUid', '==', route.params.data.ownerUid).onSnapshot(snapshot =>
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
            // console.log(route.params.data);
            setShowPosts(true);
        }, 1000);
        return (() => {
            unsubscribe;
        })
    }, []);

    // Profile details fetching
    useEffect(() => {
        db.collection("user").doc(route.params.data.ownerEmail).get().then((doc) => {
            if (doc.exists) {
                setUserData(doc.data());
            } else {
                // doc.data() will be undefined in this case
                console.log("No such document!");
            }
        }).catch((error) => {
            console.log("Error getting document:", error);
        });

        db.collection("userDetails").doc(route.params.data.ownerEmail).get().then((doc) => {
            setUserStats(doc.data());
            //following check
            if (doc.data().followers.includes(userProfile.email)) {
                setFollow({
                    text: "Following",
                    outline: "outline",
                    following: true
                });
            }
            setTimeout(() => {
                setWaitDisp({ loading: 'none', content: 'flex' });
            }, 2000);
        }).catch((error) => {
            console.log("Error getting document details:", error);
        });

        db.collection("userDetails").doc(userProfile.email).get().then((doc) => {
            setcurrentUserStats(doc.data());
        }).catch((error) => {
            console.log("Error getting document details:", error);
        });
    }, []);

    const handleFollow = async () => {
        setVisible(true);
        setTimeout(() => {
            // Update user details
            if (follow.following == false) {
                setFollow({
                    text: "Following",
                    outline: "outline",
                    following: true
                });
                userStats.followersCount++;
                userStats.followers.push(userProfile.email) // email of current user
                currentUserStats.followingsCount++;
                currentUserStats.followings.push(userData.ownerEmail);
                db.collection("userDetails").doc(route.params.data.ownerEmail).update(userStats);
                db.collection("userDetails").doc(userProfile.email).update(currentUserStats);
            } else {
                setFollow({
                    text: "Follow",
                    outline: "solid",
                    following: false
                });
                userStats.followersCount--;
                userStats.followers = userStats.followers.filter(item => item !== userProfile.email);
                currentUserStats.followingsCount--;
                currentUserStats.followings = currentUserStats.followings.filter(item => item !== userData.ownerEmail);
                db.collection("userDetails").doc(route.params.data.ownerEmail).update(userStats);
            }
            setVisible(false);
        }, 1500)

        // console.log(follow);
    }

    return (
        <ScrollView style={{ backgroundColor: '#123' }}>
            <View style={{ justifyContent: 'center', alignItems: 'center', padding: 50, marginVertical: 150, display: waitDisp.loading }}>
                <LottieView
                    style={{
                        width: 300,
                        height: 300,
                        backgroundColor: '#123',
                    }}
                    source={require("../assets/Animations/loading.json")}
                    autoPlay
                    loop
                />
            </View>
            <View style={{ display: waitDisp.content }}>
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
                                source={{ uri: userData.profileImage }}
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
                                    source={{ uri: userData.profileImage }}
                                    onLoadEnd={() => setProfileImageVisible(1)}

                                />
                            </View>
                        </Overlay>
                    </View>
                    <View>
                        <View style={{ flexDirection: 'row', marginTop: 40, justifyContent: 'space-between' }}>
                            <View style={{ marginRight: 10 }}>
                                <Text style={styles.itemHead}>Posts</Text>
                                <Text style={styles.itemDesc}>{userStats?.postsCount}</Text>
                            </View>
                            <View style={{ marginRight: 10 }}>
                                <Text style={styles.itemHead}>Followers</Text>
                                <Text style={styles.itemDesc}>{userStats?.followersCount}</Text>
                            </View>
                            <View style={{ marginRight: 10 }}>
                                <Text style={styles.itemHead}>Followings</Text>
                                <Text style={styles.itemDesc}>{userStats?.followingsCount}</Text>
                            </View>
                        </View>
                    </View>
                </View>
                <View>
                    <View style={styles.profileObjects}>
                        <View style={styles.emailView}>
                            <Text style={styles.profileName}>{(route.params?.data?.ownerName != undefined) ? route.params.data.ownerName.toUpperCase() : route.params.data.username.toUpperCase()}</Text>
                            <Text style={{ fontFamily: 'monospace', fontSize: 15, color: 'limegreen', padding: 5 }}>@{userData.handle}</Text>
                            <Text style={{ fontSize: 15, color: 'gray', padding: 5 }}>{userStats?.about}</Text>
                        </View>
                    </View>
                    {userProfile.uid != route.params.data.ownerUid ? <View>
                        <Button onPress={handleFollow} type={follow.outline} title={follow.text} buttonStyle={{ width: '80%', margin: 12, alignSelf: 'center' }} />
                    </View> : null}
                    <Overlay fullScreen overlayStyle={{ backgroundColor: 'rgba(1,1,1,0.6)' }} isVisible={visible} onBackdropPress={toggleOverlay}>
                        <View style={{ backgroundColor: 'rgba(1,1,1,0.6)', paddingVertical: 120, alignItems: 'center' }}>
                            <Text style={{ color: '#fff', fontSize: 18 }}>You {!follow.following ? " started following " : " unfollowed "} {userData.username}!</Text>
                        </View>
                    </Overlay>
                </View>
                <View style={{ backgroundColor: '#123' }}>
                    <Divider
                        orientation="horizontal"
                        width={2}
                    />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: 'ghostwhite', fontFamily: 'serif', fontWeight: 'bold', fontSize: 20, padding: 12 }}>Recent Posts</Text>
                    </View>
                    <View>
                        {showPosts ? data.slice(0).reverse().map((item) => (
                            <PollCard
                                key={item.id}
                                postId={item.id}
                                date={item?.data?.timestamp?.toDate().toString().slice(4, 10)}
                                profileImage={userData.profileImage}
                                options={item.data.options}
                                ownerUid={item.data.ownerUid}
                                name={item.data.ownerName}
                                question={item.data.question}
                                votes={item.data.votes}
                                upvotes={item.data.upvotes}
                            />
                        )) : <ActivityIndicator size="large" color="limegreen" />}
                    </View>
                    <View style={{ height: 200 }} />
                </View>
            </View>
        </ScrollView>
    )
}

export default UserProfileScreen;

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
    emailView: {
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

