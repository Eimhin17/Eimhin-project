import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { ViewShot } from 'react-native-view-shot';
import ReportProfileModal from './ReportProfileModal';

interface ProfileCardWithReportingProps {
  userId: string;
  userName: string;
  userAge: number;
  userBio: string;
  userPhotos: string[];
  onReport?: () => void;
}

export default function ProfileCardWithReporting({
  userId,
  userName,
  userAge,
  userBio,
  userPhotos,
  onReport,
}: ProfileCardWithReportingProps) {
  const [showReportModal, setShowReportModal] = useState(false);
  const profileCardRef = useRef<View>(null);

  const handleReportPress = () => {
    setShowReportModal(true);
    onReport?.();
  };

  const handleReportClose = () => {
    setShowReportModal(false);
  };

  return (
    <>
      <ViewShot ref={profileCardRef} options={{ format: 'jpg', quality: 0.8 }}>
        <View style={styles.profileCard}>
          {/* Profile Photo */}
          <View style={styles.photoContainer}>
            {userPhotos.length > 0 ? (
              <Image source={{ uri: userPhotos[0] }} style={styles.profilePhoto} />
            ) : (
              <View style={styles.placeholderPhoto}>
                <FontAwesome5 name="user" size={40} color="#C0C0C0" />
              </View>
            )}
          </View>

          {/* Profile Info */}
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{userName}, {userAge}</Text>
            <Text style={styles.userBio} numberOfLines={3}>
              {userBio || 'No bio available'}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.passButton}>
              <FontAwesome5 name="times" size={20} color="#FF5722" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.likeButton}>
              <FontAwesome5 name="heart" size={20} color="#4CAF50" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.reportButton}
              onPress={handleReportPress}
            >
              <FontAwesome5 name="flag" size={16} color="#FF9800" />
            </TouchableOpacity>
          </View>
        </View>
      </ViewShot>

      {/* Report Modal */}
      <ReportProfileModal
        visible={showReportModal}
        onClose={handleReportClose}
        reportedUserId={userId}
        reportedUserName={userName}
      />
    </>
  );
}

const styles = StyleSheet.create({
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  photoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  placeholderPhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    marginBottom: 20,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1B1B3A',
    textAlign: 'center',
    marginBottom: 8,
  },
  userBio: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  passButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  likeButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
