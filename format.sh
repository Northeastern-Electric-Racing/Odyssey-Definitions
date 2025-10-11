# requires jq and sponge from moreutils


if [ "$1" = "check" ];
then
    failed=0
    echo "Checking files"
    for file in `find ./can-messages -type f`;
    do
    if ! jq . "$file" | diff -q - "$file" > /dev/null;
    then
	echo "FILE FAILED FORMAT CHECK: $file"
        failed=1
    else
        echo "$file"
    fi
    done
    exit "$failed" 
else
    echo "Formatting files"
    for file in `find ./can-messages -type f`;
    do
       echo "$file"
       jq . "$file" | sponge "$file"		
    done
fi
