"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function Upload() {
    const inputRef = React.useRef<HTMLInputElement | null>(null);

    const [file, setFile] = React.useState<File | null>(null);
    const [text, setText] = React.useState<string>("");
    const [imgUrl, setImgUrl] = React.useState<string>("");

    function onChange(e: React.ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0] ?? null
        setFile(f)
    }

    return (
        <div>
            <input type="file" onChange={onChange} />

            {file && (
                <p>
                    Selected file: {file.name} ({file.size} bytes)
                </p>
            )}
        </div>
    )
}