import { useParams } from "react-router-dom"
import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"

export default function Profile() {
  const { username } = useParams()
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    const load = async () => {
      const unameDoc = await getDoc(doc(db,"usernames",username))
      if(!unameDoc.exists()) return

      const uid = unameDoc.data().uid

      const profileDoc = await getDoc(doc(db,"profiles",uid))
      setProfile(profileDoc.data())
    }

    load()
  },[username])

  if(!profile) return <div>Loading...</div>

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      <div className="glass-card p-6 flex gap-4 items-center">
        <img
          src={profile.pfp}
          className="w-20 h-20 rounded-full"
        />

        <div>
          <h1 className="text-xl font-bold">
            {profile.displayName}
          </h1>

          <p className="text-muted-foreground">
            @{profile.username}
          </p>
        </div>
      </div>

      <div className="glass-card p-6">
        <p>{profile.bio || "No bio yet."}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">

        <div className="glass-card p-4 text-center">
          <p className="text-lg font-bold">{profile.streak}</p>
          <p className="text-sm">Day Streak</p>
        </div>

        <div className="glass-card p-4 text-center">
          <p className="text-lg font-bold">{profile.focusMinutes}</p>
          <p className="text-sm">Focus Minutes</p>
        </div>

        <div className="glass-card p-4 text-center">
          <p className="text-lg font-bold">{profile.level}</p>
          <p className="text-sm">Level</p>
        </div>

      </div>

    </div>
  )
}
