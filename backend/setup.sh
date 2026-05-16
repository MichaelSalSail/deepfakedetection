if [[ "$OSTYPE" == "darwin"* ]]; then
    pip3 install -r requirements-mac.txt
else
    pip3 install -r requirements-linux.txt
fi