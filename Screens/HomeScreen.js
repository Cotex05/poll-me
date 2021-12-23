import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, ToastAndroid, View } from 'react-native';
import PollCard from '../Components/PollCard';
import LottieView from 'lottie-react-native';
import { Button } from 'react-native-elements';

import { db, auth } from '../firebase';

const HomeScreen = ({ navigation, route }) => {

    const [data, setData] = useState([]);
    const [newData, setNewData] = useState([]);

    const [loadingDisp, setLoadingDisp] = useState({ 'loader': 'none', 'button': 'flex' });
    const [refreshing, setRefreshing] = useState(false);
    const [refresherCall, setRefresherCall] = useState(0);
    const [visible, setVisible] = useState(true);
    const [lastVisible, setLastVisible] = useState();

    useEffect(() => {
        const unsubscribe = db.collection('polls').orderBy("timestamp", "desc").limit(10).onSnapshot(snapshot => {
            setData(snapshot.docs.map(doc => ({
                id: doc.id,
                data: doc.data(),
            }))
            )
            setNewData([]);
            setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        });
        setTimeout(() => {
            setVisible(false);
        }, 4000);
        return (() => {
            unsubscribe();
        })
    }, [refresherCall]);

    const moreData = () => {
        setLoadingDisp({ 'loader': 'flex', 'button': 'none' });
        if (lastVisible != undefined) {
            let arr = [];
            newData.map(item => {
                arr.push(item);
            })
            const unsubscribe = db.collection('polls').orderBy("timestamp", "desc").startAfter(lastVisible).limit(10).onSnapshot(snapshot => {
                snapshot.docs.map(doc => {
                    arr.push({
                        id: doc.id,
                        data: doc.data(),
                    })
                });
                setNewData(arr);
                setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
            });
            console.log("bottom reached!")
            setTimeout(() => {
                setLoadingDisp({ 'loader': 'none', 'button': 'flex' });
                arr = [];
            }, 4000);
            return (() => {
                unsubscribe();
            })
        } else {
            setTimeout(() => {
                setLoadingDisp({ 'loader': 'none', 'button': 'flex' });
                ToastAndroid.showWithGravity(
                    "Nothing to see more",
                    ToastAndroid.SHORT,
                    ToastAndroid.BOTTOM
                );
            }, 2000);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setVisible(true);
        setRefresherCall(refresherCall + 1);
        setTimeout(() => {
            setVisible(false);
            setRefreshing(false);
            ToastAndroid.showWithGravity(
                "Refreshed!",
                ToastAndroid.SHORT,
                ToastAndroid.BOTTOM
            );
        }, 3000);
    }, []);

    const CloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }) => {
        // console.log(Math.floor(layoutMeasurement.height), Math.ceil(contentOffset.y), Math.floor(contentSize.height))
        return Math.floor(layoutMeasurement.height) + Math.ceil(contentOffset.y) == Math.floor(contentSize.height);
    }

    return (
        <ScrollView
            // onScroll={({ nativeEvent }) => {
            //     if (CloseToBottom(nativeEvent)) {
            //         setLoadingDisp('flex');
            //         moreData();
            //     }
            // }}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                />
            }
            style={styles.container}
        >
            <StatusBar style="light" />
            <View>
                {visible ? <View style={{ justifyContent: 'center', alignItems: 'center', padding: 50, marginVertical: 150 }}>
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
                </View> : null}
                {data.map(({ id, data }) => (
                    <View key={id}>
                        <PollCard
                            key={id}
                            id={id}
                            postId={id}
                            date={data?.timestamp?.toDate().toString().slice(4, 10)}
                            profileImage={data.ownerPhoto}
                            options={data.options}
                            ownerUid={data.ownerUid}
                            name={data.ownerName}
                            question={data.question}
                            votes={data.votes}
                            upvotes={data.upvotes}
                            navi={navigation}
                        />
                    </View>
                ))}
                {newData.map(({ id, data }) => (
                    <View key={id}>
                        <PollCard
                            key={id}
                            id={id}
                            postId={id}
                            date={data?.timestamp?.toDate().toString().slice(4, 10)}
                            profileImage={data.ownerPhoto}
                            options={data.options}
                            ownerUid={data.ownerUid}
                            name={data.ownerName}
                            question={data.question}
                            votes={data.votes}
                            upvotes={data.upvotes}
                            navi={navigation}
                        />
                    </View>
                ))}
            </View>
            <Button buttonStyle={{ width: 200, alignSelf: 'center', display: loadingDisp.button }} type="outline" title="Load More" onPress={moreData} />
            <View style={{ height: 100, padding: 25 }} >
                <ActivityIndicator color="limegreen" size={30} style={{ display: loadingDisp.loader }} />
            </View>
        </ScrollView>
    )
}

export default HomeScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#123',
    },
})
