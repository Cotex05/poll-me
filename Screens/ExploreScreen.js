import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, ToastAndroid, View } from 'react-native';
import PollCard from '../Components/PollCard';

import { db } from '../firebase';


const ExploreScreen = ({ navigation }) => {

    const [data, setData] = useState([]);

    useEffect(() => {
        const unsubscribe = db.collection('polls').orderBy("upvotes").onSnapshot(snapshot =>
            setData(snapshot.docs.map(doc => ({
                id: doc.id,
                data: doc.data(),
            }))
            )
        );
        return (() => { unsubscribe() });
    }, []);

    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(() => {
        setRefreshing(true);

        setTimeout(() => {
            setRefreshing(false);
            ToastAndroid.showWithGravity(
                "Refreshed!",
                ToastAndroid.SHORT,
                ToastAndroid.BOTTOM
            );
        }, 1500);
    }, []);

    return (
        <ScrollView
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
                {data.slice(0).reverse().map(({ id, data }) => (
                    <PollCard
                        key={id}
                        id={id}
                        postId={id}
                        date={data?.timestamp?.toDate().toString().slice(4, 10)}
                        profileImage={data.ownerPhoto}
                        options={data.options}
                        name={data.ownerName}
                        question={data.question}
                        votes={data.votes}
                        upvotes={data.upvotes}
                        navi={navigation}
                    />
                ))}
            </View>
            <View style={{ height: 100 }} />
        </ScrollView>
    )
}

export default ExploreScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#123',
    }
})
