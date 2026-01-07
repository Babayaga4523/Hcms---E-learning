<?php

require 'bootstrap/app.php';

$m = \App\Models\Module::find(21);
echo 'is_active: ' . $m->is_active . "\n";
echo 'approval_status: ' . $m->approval_status . "\n";

$u = \App\Models\UserTraining::where('user_id', 1)->where('module_id', 21)->first();
if ($u) {
    echo 'user_training exists, status: ' . $u->status . "\n";
} else {
    echo 'no user_training' . "\n";
}
?>