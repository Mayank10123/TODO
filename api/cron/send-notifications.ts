import { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../firebase-admin.js';

/**
 * Cron Job: Send scheduled notifications
 * Runs every 5 minutes
 * Triggered by: /api/cron/send-notifications
 */

async function sendEmailNotification(
  userEmail: string,
  title: string,
  message: string
): Promise<boolean> {
  try {
    // For now, just log it (email setup comes later)
    console.log(`📧 Would send email to ${userEmail}: ${title}`);
    
    // TODO: Integrate with SendGrid/Nodemailer
    // const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     personalizations: [{ to: [{ email: userEmail }] }],
    //     from: { email: process.env.FROM_EMAIL },
    //     subject: title,
    //     content: [{ type: 'text/html', value: message }],
    //   }),
    // });

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

async function sendPushNotification(
  userId: string,
  title: string,
  message: string
): Promise<boolean> {
  try {
    // For now, just log it (push setup comes later)
    console.log(`📱 Would send push to ${userId}: ${title}`);
    
    // TODO: Integrate with Firebase Cloud Messaging
    // const messaging = admin.messaging();
    // await messaging.sendToTopic(userId, {
    //   notification: { title, body: message },
    // });

    return true;
  } catch (error) {
    console.error('Error sending push:', error);
    return false;
  }
}

async function createInAppNotification(
  userId: string,
  title: string,
  message: string
): Promise<boolean> {
  try {
    // Create in-app notification in Firestore
    await db
      .collection('users')
      .doc(userId)
      .collection('notifications')
      .add({
        title: `🔔 ${title}`,
        message,
        type: 'notification',
        read: false,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });

    console.log(`💬 In-app notification created for ${userId}`);
    return true;
  } catch (error) {
    console.error('Error creating in-app notification:', error);
    return false;
  }
}

function calculateNextTrigger(
  notification: any,
  lastTrigger: Date
): Date | null {
  const frequency = notification.frequency;
  const deliveryTime = notification.deliveryTime; // "HH:MM"
  const customDays = notification.customDays || [];

  if (frequency === 'once') {
    return null; // No next trigger for one-time notifications
  }

  const next = new Date(lastTrigger);
  const [hours, minutes] = deliveryTime.split(':').map(Number);

  if (frequency === 'daily') {
    next.setDate(next.getDate() + 1);
    next.setHours(hours, minutes, 0, 0);
  } else if (frequency === 'weekly') {
    next.setDate(next.getDate() + 7);
    next.setHours(hours, minutes, 0, 0);
  } else if (frequency === 'custom' && customDays.length > 0) {
    // Find next day in customDays
    let daysToAdd = 1;
    let found = false;

    for (let i = 1; i <= 7; i++) {
      const checkDate = new Date(lastTrigger);
      checkDate.setDate(checkDate.getDate() + i);
      
      if (customDays.includes(checkDate.getDay())) {
        daysToAdd = i;
        found = true;
        break;
      }
    }

    if (found) {
      next.setDate(next.getDate() + daysToAdd);
    }
    next.setHours(hours, minutes, 0, 0);
  }

  return next;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Verify this is a cron request from Vercel
  const cronSecret = req.headers['x-vercel-cron-secret'];
  if (cronSecret !== process.env.CRON_SECRET) {
    console.warn('⚠️ Unauthorized cron request');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('🕐 Cron job started: Checking for notifications to send...');

    const now = new Date();
    let sentCount = 0;
    let errorCount = 0;

    // Get all users
    const usersSnapshot = await db.collection('users').get();

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userEmail = userDoc.data().email;

      // Get all notifications for this user
      const notificationsSnapshot = await db
        .collection('users')
        .doc(userId)
        .collection('notifications')
        .where('enabled', '==', true)
        .where('nextTrigger', '<=', now)
        .get();

      for (const notifDoc of notificationsSnapshot.docs) {
        const notif = notifDoc.data();
        const notifId = notifDoc.id;

        try {
          console.log(
            `📢 Sending notification to ${userId}: ${notif.title}`
          );

          // Send via appropriate channels
          const { deliveryMethod } = notif;

          if (
            deliveryMethod === 'in-app' ||
            deliveryMethod === 'all'
          ) {
            await createInAppNotification(
              userId,
              notif.title,
              notif.message
            );
          }

          if (
            deliveryMethod === 'email' ||
            deliveryMethod === 'all'
          ) {
            if (userEmail) {
              await sendEmailNotification(
                userEmail,
                notif.title,
                notif.message
              );
            }
          }

          if (
            deliveryMethod === 'push' ||
            deliveryMethod === 'all'
          ) {
            await sendPushNotification(
              userId,
              notif.title,
              notif.message
            );
          }

          // Calculate next trigger or mark as sent
          const nextTrigger = calculateNextTrigger(notif, now);

          if (nextTrigger) {
            // Update with next trigger time
            await db
              .collection('users')
              .doc(userId)
              .collection('notifications')
              .doc(notifId)
              .update({ nextTrigger });

            console.log(
              `✅ Notification rescheduled for ${nextTrigger.toISOString()}`
            );
          } else {
            // Mark one-time notification as sent
            await db
              .collection('users')
              .doc(userId)
              .collection('notifications')
              .doc(notifId)
              .update({ sent: true, nextTrigger: null });

            console.log(`✅ One-time notification marked as sent`);
          }

          sentCount++;
        } catch (error: any) {
          console.error(
            `❌ Error sending notification ${notifId}:`,
            error.message
          );
          errorCount++;
        }
      }
    }

    console.log(
      `✅ Cron job completed: ${sentCount} sent, ${errorCount} errors`
    );

    return res.status(200).json({
      success: true,
      sent: sentCount,
      errors: errorCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ Cron job error:', error);
    return res.status(500).json({
      error: 'Cron job failed',
      message: error.message,
    });
  }
}
