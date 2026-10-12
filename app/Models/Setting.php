<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = ['group', 'key', 'value'];

    /**
     * Get a single setting value.
     */
    public static function get(string $group, string $key, $default = null)
    {
        return static::where('group', $group)
            ->where('key', $key)
            ->value('value') ?? $default;
    }

    /**
     * Set/update a single setting value.
     */
    public static function set(string $group, string $key, $value): void
    {
        static::updateOrCreate(
            ['group' => $group, 'key' => $key],
            ['value' => $value]
        );
    }

    /**
     * Get all settings for a group as key => value array.
     */
    public static function group(string $group): array
    {
        return static::where('group', $group)
            ->pluck('value', 'key')
            ->toArray();
    }

    /**
     * Bulk save an array of key => value for a group.
     */
    public static function saveGroup(string $group, array $data): void
    {
        foreach ($data as $key => $value) {
            static::set($group, $key, $value);
        }
    }
}